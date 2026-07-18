const Redis = require('ioredis')

// ─── Redis Client ─────────────────────────────────────────────────────────────
// Подключение через REDIS_URL из .env или дефолтный localhost:6379
// Shared между всеми PM2 воркерами — один кэш на всех
// ─────────────────────────────────────────────────────────────────────────────
const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    const delay = Math.min(times * 500, 5000)
    if (times > 10) return null
    return delay
  }
})

redis.on('connect',      () => console.log('[Redis] Connected'))
redis.on('error',        (err) => console.error('[Redis] Error:', err.message))
redis.on('reconnecting', () => console.log('[Redis] Reconnecting...'))

// ─── Cache Middleware ─────────────────────────────────────────────────────────
const cacheMiddleware = (duration = 7200) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next()

    const key = `lunex:${req.originalUrl}`

    try {
      const cached = await redis.get(key)
      if (cached) return res.json(JSON.parse(cached))
    } catch (err) {
      console.warn('[Cache] Redis get error:', err.message)
      return next()
    }

    const originalJson = res.json.bind(res)
    res.json = async (body) => {
      if (body && body.success !== false) {
        try {
          await redis.setex(key, duration, JSON.stringify(body))
        } catch (err) {
          console.warn('[Cache] Redis set error:', err.message)
        }
      }
      originalJson(body)
    }

    next()
  }
}

// ─── Совместимость со старым myCache.getStats() ───────────────────────────────
const myCache = {
  async getStats() {
    try {
      const info = await redis.info('memory')
      const memMatch = info.match(/used_memory:(\d+)/)
      const keysCount = await redis.dbsize()
      return { vsize: memMatch ? parseInt(memMatch[1]) : 0, ksize: 0, keys: keysCount }
    } catch {
      return { vsize: 0, ksize: 0, keys: 0 }
    }
  }
}

module.exports = { cacheMiddleware, myCache, redis }

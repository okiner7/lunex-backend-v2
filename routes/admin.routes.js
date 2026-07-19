const { Router } = require('express')
const asyncHandler = require('../src/middleware/asyncHandler')
const adminAuth = require('../src/middleware/adminAuth')
const userStore = require('../services/storage/userStore')
const proxyManager = require('../src/middleware/proxyManager')
const { myCache } = require('../src/middleware/cache')

const router = Router()

// All routes here are protected by adminAuth
router.use(adminAuth)

router.get('/stats', asyncHandler(async (req) => {
  const users = await userStore.countAllUsers()
  const activeUsers = await userStore.countActiveUsers()
  const proxyStats = proxyManager.getProxyStats()
  const cacheStats = await myCache.getStats()
  const memory = process.memoryUsage()

  return {
    users,
    activeUsers,
    proxies: proxyStats,
    cache: cacheStats,
    server: {
      uptime: process.uptime(),
      memory: {
        rss: Math.round(memory.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + ' MB'
      }
    }
  }
}))

router.get('/proxies', asyncHandler(async (req) => {
  return proxyManager.getProxyStats().proxies
}))

router.post('/proxies/reset', asyncHandler(async (req) => {
  // Hacky way to reset cooldowns: we iterate over the internal pool
  const pool = proxyManager._pool
  let resetCount = 0
  if (pool && pool.proxies) {
    const now = Date.now()
    for (const proxy of pool.proxies) {
      if (proxy.cooldownUntil > now) {
        proxy.cooldownUntil = 0
        proxy.fails = 0
        resetCount++
      }
    }
  }
  return { message: `Reset cooldowns for ${resetCount} proxies` }
}))

module.exports = router

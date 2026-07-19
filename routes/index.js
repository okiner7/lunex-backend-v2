const { Router } = require('express')
const youtubeRoutes = require('./youtube.routes')
const soundcloudRoutes = require('./soundcloud.routes')
const authRoutes = require('./auth.routes')
const meRoutes = require('./me.routes')
const userDataRoutes = require('./user-data.routes')
const themesRoutes = require('./themes.routes')
const { myCache, redis } = require('../src/middleware/cache')
const db = require('../services/storage/database')
const statsStore = require('../services/storage/statsStore')
const userStore = require('../services/storage/userStore')
const proxyHealth = require('../services/health/proxyHealth')
const { getProxyStats } = require('../src/middleware/proxyManager')

const router = Router()

router.get('/', (req, res) => res.json({ status: 'ok', service: 'Lunex API' }))

router.get('/api/status', async (req, res) => {
    const memUsage = process.memoryUsage();
    const appMb = (memUsage.rss / 1024 / 1024).toFixed(2);
    const stats = await myCache.getStats();
    const cacheMb = ((stats.vsize) / 1024 / 1024).toFixed(2);
    const redisStatus = redis ? redis.status : 'disconnected';
    
    // Fetch stats from DB
    const getCount = (collection) => new Promise(resolve => collection.count({}, (err, c) => resolve(c || 0)))
    const [usersCount, playlistsCount, likesCount, globalStats, activeUsers] = await Promise.all([
        userStore.countAllUsers(),
        getCount(db.playlists),
        getCount(db.likes),
        statsStore.getGlobalStats(),
        userStore.countActiveUsers()
    ])

    res.json({
        success: true,
        data: {
            memory: {
                appMemoryMB: parseFloat(appMb),
                cacheMemoryMB: parseFloat(cacheMb),
                cacheItems: stats.keys,
            },
            redis: {
                enabled: !!redis,
                status: redisStatus
            },
            stats: {
                totalUsers: usersCount,
                activeUsersToday: activeUsers,
                totalPlaylists: playlistsCount,
                totalLikes: likesCount,
                totalListens: globalStats.totalListens,
                totalSearches: globalStats.totalSearches
            },
            // LNX-2026-004 fix: не раскрываем IP/URL прокси публично — только счётчики
            proxy: {
              total: getProxyStats().total,
              healthy: getProxyStats().healthy
            },
            proxyHealthy: proxyHealth.isHealthy(),
            uptimeSeconds: process.uptime()
        }
    })
})

router.get('/api/stats/top-tracks', async (req, res) => {
    try {
        // LNX-2026-010 fix: лимит не более 50 записей
        const limit = Math.min(parseInt(req.query.limit) || 10, 50)
        const tracks = await statsStore.getTopTracks(limit)
        res.json({ success: true, data: tracks })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
})

router.use('/api/yt', youtubeRoutes)
router.use('/api/sc', soundcloudRoutes)
router.use('/auth', authRoutes)
router.use('/me', meRoutes)
router.use('/me', userDataRoutes)
router.use('/themes', themesRoutes)

module.exports = router

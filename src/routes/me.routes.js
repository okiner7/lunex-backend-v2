const { Router } = require('express')
const authRequired = require('../middleware/authRequired')
const { TELEGRAM_BOT_TOKEN } = require('../config/env')
const https = require('https')

const router = Router()

router.get('/', authRequired, (req, res) => {
  const user = { ...req.user }
  // LNX-2026-007 fix: если avatar — это file_path (не полный URL), заменяем на прокси-ссылку
  if (user.avatar && !user.avatar.startsWith('http')) {
    user.avatar = `/me/avatar`
  }
  res.json({ success: true, data: user })
})

// LNX-2026-007: безопасный прокси для аватаров Telegram — bot token остаётся на сервере
router.get('/avatar', authRequired, (req, res) => {
  const filePath = req.user.avatar
  if (!filePath || filePath.startsWith('http')) {
    return res.status(404).json({ error: 'No avatar' })
  }
  const url = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`
  https.get(url, (tgRes) => {
    if (tgRes.statusCode !== 200) return res.status(404).json({ error: 'Avatar not found' })
    res.setHeader('Content-Type', tgRes.headers['content-type'] || 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=86400')
    tgRes.pipe(res)
  }).on('error', () => res.status(500).json({ error: 'Failed to fetch avatar' }))
})

module.exports = router

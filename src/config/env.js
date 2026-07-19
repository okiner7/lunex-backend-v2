require('dotenv').config()

// Секреты обязательны. Без них сервер не запустится.
function requireEnv(key) {
  const val = process.env[key]
  if (!val) throw new Error(`[Lunex] Отсутствует обязательная переменная среды: ${key}`)
  return val
}

module.exports = {
  PORT: process.env.PORT || 3000,
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000',
  // LNX-2026-002: убраны небезопасные fallback — сервер упадёт при старте если секреты не заданы
  JWT_SECRET: requireEnv('JWT_SECRET'),
  APP_SECRET: requireEnv('APP_SECRET'),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',

  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME || 'LunexAuthBot',

  DEV_EMAILS: (process.env.DEV_EMAILS || '').split(',').filter(Boolean),
  DEV_TELEGRAM_IDS: (process.env.DEV_TELEGRAM_IDS || '').split(',').filter(Boolean),
}

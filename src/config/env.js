require('dotenv').config()

module.exports = {
  PORT: process.env.PORT || 3000,
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  APP_SECRET: process.env.APP_SECRET || 'my-super-secret-desktop-key',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',

  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME || 'LunexAuthBot',

  DEV_EMAILS: (process.env.DEV_EMAILS || '').split(',').filter(Boolean),
  DEV_TELEGRAM_IDS: (process.env.DEV_TELEGRAM_IDS || '').split(',').filter(Boolean),
}

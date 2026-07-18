const crypto = require('crypto')
const { TELEGRAM_BOT_TOKEN } = require('../../src/config/env')

function validateAuthData(data) {
  const { hash, ...fields } = data
  if (!hash) return null

  const checkString = Object.keys(fields)
    .sort()
    .map(key => `${key}=${fields[key]}`)
    .join('\n')

  const secret = crypto.createHash('sha256').update(TELEGRAM_BOT_TOKEN).digest()
  const hmac = crypto.createHmac('sha256', secret).update(checkString).digest('hex')

  if (hmac !== hash) return null

  return {
    telegramId: String(fields.id),
    username: fields.username || fields.first_name || `tg_${fields.id}`,
    avatar: fields.photo_url || null
  }
}

module.exports = { validateAuthData }

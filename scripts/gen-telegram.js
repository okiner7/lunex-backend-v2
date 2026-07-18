const crypto = require('crypto')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const botToken = process.env.TELEGRAM_BOT_TOKEN
if (!botToken) {
  console.error('TELEGRAM_BOT_TOKEN not set in .env')
  process.exit(1)
}

const payload = {
  id: parseInt(process.argv[2]) || 123456789,
  first_name: process.argv[3] || 'TestUser',
  username: process.argv[4] || 'testuser',
  auth_date: Math.floor(Date.now() / 1000)
}

const secret = crypto.createHash('sha256').update(botToken).digest()
const dataCheckString = Object.keys(payload)
  .sort()
  .map(k => k + '=' + payload[k])
  .join('\n')
payload.hash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex')

console.log(JSON.stringify(payload, null, 2))
console.log('\n--- Postman: POST http://localhost:3000/auth/telegram ---')
console.log('Body (raw JSON):')
console.log(JSON.stringify(payload))

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

const http = require('http')
const body = JSON.stringify(payload)

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/auth/telegram',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': body.length }
}, res => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => {
    console.log('Status:', res.statusCode)
    const json = JSON.parse(data)
    if (json.success) {
      console.log('\nToken:', json.data.token)
      console.log('\nUser:', JSON.stringify(json.data.user, null, 2))
      console.log('\n--- Postman headers ---')
      console.log('Authorization: Bearer ' + json.data.token)
    } else {
      console.log('Error:', json.error)
    }
  })
})

req.write(body)
req.end()

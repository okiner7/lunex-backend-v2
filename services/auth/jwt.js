const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../../src/config/env')

function sign(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' })
}

function verify(token) {
  return jwt.verify(token, JWT_SECRET)
}

module.exports = { sign, verify }

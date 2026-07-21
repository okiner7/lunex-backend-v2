const db = require('./database')
const crypto = require('crypto')

// LNX-2026-024: use crypto.randomInt instead of Math.random (not cryptographically secure)
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[crypto.randomInt(0, chars.length)]
  }
  return code
}

// Generate NeDB-like string _id for compatibility
function genId() { return crypto.randomBytes(8).toString('hex') }

async function create(telegramId, name, avatar) {
  const code = generateCode()
  const now = new Date()
  const doc = {
    _id: genId(),
    code,
    telegramId,
    name,
    avatar,
    createdAt: now,
    expiresAt: new Date(now.getTime() + 5 * 60 * 1000)
  }
  
  await removeByTelegramId(telegramId)
  await db.authCodes.insertOne(doc)
  return doc
}

async function findByCode(code) {
  return await db.authCodes.findOne({ code: code.toUpperCase() })
}

async function removeByTelegramId(telegramId) {
  return await db.authCodes.deleteMany({ telegramId })
}

async function remove(id) {
  return await db.authCodes.deleteOne({ _id: id })
}

module.exports = { create, findByCode, remove, removeByTelegramId }

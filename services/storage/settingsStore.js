const db = require('./database')
const crypto = require('crypto')

function genId() { return crypto.randomBytes(8).toString('hex') }

async function get(userId) {
  const doc = await db.settings.findOne({ userId })
  return doc || { theme: 'dark', accent: '#b485ff' }
}

async function upsert(userId, fields) {
  const ALLOWED = ['theme', 'accent', 'customThemeData']
  const safe = {}
  for (const key of ALLOWED) {
    if (fields[key] !== undefined) safe[key] = fields[key]
  }
  const existing = await get(userId)
  const doc = { ...existing, ...safe, userId }
  
  if (!doc._id) doc._id = genId()
  
  await db.settings.replaceOne({ userId }, doc, { upsert: true })
  return doc
}

module.exports = { get, upsert }

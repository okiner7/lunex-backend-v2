const db = require('./database')

async function get(userId) {
  return new Promise((resolve, reject) => {
    db.settings.findOne({ userId }, (err, doc) => {
      if (err) return reject(err)
      resolve(doc || { theme: 'dark', accent: '#b485ff' })
    })
  })
}

async function upsert(userId, fields) {
  // LNX-2026-025: whitelist only known fields to prevent arbitrary field injection
  const ALLOWED = ['theme', 'accent', 'customThemeData']
  const safe = {}
  for (const key of ALLOWED) {
    if (fields[key] !== undefined) safe[key] = fields[key]
  }
  const existing = await get(userId)
  const doc = { ...existing, ...safe, userId }
  return new Promise((resolve, reject) => {
    db.settings.update({ userId }, doc, { upsert: true }, (err) => {
      if (err) return reject(err)
      resolve(doc)
    })
  })
}

module.exports = { get, upsert }

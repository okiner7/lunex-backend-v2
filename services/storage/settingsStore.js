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
  const existing = await get(userId)
  const doc = { ...existing, ...fields, userId }
  return new Promise((resolve, reject) => {
    db.settings.update({ userId }, doc, { upsert: true }, (err) => {
      if (err) return reject(err)
      resolve(doc)
    })
  })
}

module.exports = { get, upsert }

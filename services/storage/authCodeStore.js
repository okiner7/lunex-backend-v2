const db = require('./database')

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

async function create(telegramId, name, avatar) {
  const code = generateCode()
  const now = new Date()
  const doc = {
    code,
    telegramId,
    name,
    avatar,
    createdAt: now,
    expiresAt: new Date(now.getTime() + 5 * 60 * 1000)
  }
  // remove old code for same user
  await removeByTelegramId(telegramId)

  return new Promise((resolve, reject) => {
    db.authCodes.insert(doc, (err, newDoc) => {
      if (err) return reject(err)
      resolve(newDoc)
    })
  })
}

async function findByCode(code) {
  return new Promise((resolve, reject) => {
    db.authCodes.findOne({ code: code.toUpperCase() }, (err, doc) => {
      if (err) return reject(err)
      resolve(doc || null)
    })
  })
}

async function removeByTelegramId(telegramId) {
  return new Promise((resolve, reject) => {
    db.authCodes.remove({ telegramId }, { multi: true }, (err, num) => {
      if (err) return reject(err)
      resolve(num)
    })
  })
}

async function remove(id) {
  return new Promise((resolve, reject) => {
    db.authCodes.remove({ _id: id }, {}, (err, num) => {
      if (err) return reject(err)
      resolve(num)
    })
  })
}

module.exports = { create, findByCode, remove, removeByTelegramId }

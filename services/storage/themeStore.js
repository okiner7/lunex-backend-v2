const db = require('./database')
const crypto = require('crypto')

function genId() { return crypto.randomBytes(8).toString('hex') }

async function getAll() {
  return await db.themes.find({}).sort({ downloads: -1 }).toArray()
}

async function create(authorId, authorName, name, themeData) {
  const count = await db.themes.countDocuments({ authorId })
  if (count >= 10) throw new Error('Maximum themes per user reached (10)')

  const doc = {
    _id: genId(),
    authorId,
    authorName,
    name,
    themeData,
    downloads: 0,
    createdAt: new Date()
  }
  
  await db.themes.insertOne(doc)
  return doc
}

async function incrementDownloads(id) {
  return await db.themes.updateOne({ _id: id }, { $inc: { downloads: 1 } })
}

module.exports = { getAll, create, incrementDownloads }

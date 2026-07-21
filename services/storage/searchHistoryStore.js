const db = require('./database')
const statsStore = require('./statsStore')
const crypto = require('crypto')

function genId() { return crypto.randomBytes(8).toString('hex') }

const MAX_HISTORY = 50

async function getRecent(userId, limit = 10) {
  const docs = await db.searchHist.find({ userId }).sort({ createdAt: -1 }).limit(limit).toArray()
  return (docs || []).map(d => ({ query: d.query, createdAt: d.createdAt }))
}

async function add(userId, query) {
  const doc = { _id: genId(), userId, query, createdAt: new Date() }
  
  await db.searchHist.insertOne(doc)
  await trim(userId)
  await statsStore.incrementSearchCount().catch(console.error)
  const userStore = require('./userStore')
  await userStore.incrementUserStat(userId, 'totalSearches').catch(console.error)
  const recent = await getRecent(userId, 10)
  return recent
}

async function trim(userId) {
  const docs = await db.searchHist.find({ userId }).sort({ createdAt: -1 }).skip(MAX_HISTORY).toArray()
  const ids = docs.map(d => d._id)
  if (ids.length === 0) return
  await db.searchHist.deleteMany({ _id: { $in: ids } })
}

async function clear(userId) {
  return await db.searchHist.deleteMany({ userId })
}

module.exports = { getRecent, add, clear }

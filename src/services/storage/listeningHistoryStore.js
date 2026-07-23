const db = require('./database')
const statsStore = require('./statsStore')
const crypto = require('crypto')

function genId() { return crypto.randomBytes(8).toString('hex') }

const MAX_HISTORY = 50

async function getRecent(userId, limit = 50) {
  const docs = await db.listeningHist.find({ userId }).sort({ playedAt: -1 }).limit(limit).toArray()
  return (docs || []).map(d => ({
    id: d.id,
    source: d.source,
    title: d.title,
    artist: d.artist,
    artwork: d.artwork,
    duration: d.duration,
    playedAt: d.playedAt
  }))
}

async function add(userId, track) {
  const doc = {
    _id: genId(),
    userId,
    id: track.id,
    source: track.source,
    title: track.title,
    artist: track.artist,
    artwork: track.artwork,
    duration: track.duration,
    playedAt: new Date()
  }
  
  await db.listeningHist.insertOne(doc)
  await trim(userId)
  await statsStore.incrementListenCount().catch(console.error)
  await statsStore.incrementTrackPlay(track).catch(console.error)
  const userStore = require('./userStore')
  await userStore.incrementUserStat(userId, 'totalListens').catch(console.error)
  return doc
}

async function trim(userId) {
  const docs = await db.listeningHist.find({ userId }).sort({ playedAt: -1 }).skip(MAX_HISTORY).toArray()
  const ids = docs.map(d => d._id)
  if (ids.length === 0) return
  await db.listeningHist.deleteMany({ _id: { $in: ids } })
}

async function clear(userId) {
  return await db.listeningHist.deleteMany({ userId })
}

module.exports = { getRecent, add, clear }

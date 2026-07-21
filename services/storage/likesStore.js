const db = require('./database')
const badgeStore = require('./badgeStore')
const crypto = require('crypto')

function genId() { return crypto.randomBytes(8).toString('hex') }

function buildUserId(provider, providerId) {
  return `${provider}_${providerId}`
}

async function getAll(userId) {
  return await db.likes.find({ userId }).sort({ likedAt: -1 }).toArray()
}

async function add(userId, track, providerId) {
  const existing = await findOne(userId, track.id, track.source)
  if (existing) {
    await remove(existing._id)
    return { liked: false }
  }
  const doc = {
    _id: genId(),
    userId,
    id: track.id,
    trackId: track.id,
    source: track.source,
    title: track.title,
    artist: track.artist,
    duration: track.duration,
    artwork: track.artwork,
    url: track.url,
    likedAt: new Date()
  }
  
  await db.likes.insertOne(doc)
  const count = await countByUser(userId)
  await badgeStore.checkAndGrantLikeBadges(providerId, count)
  return { liked: true }
}

async function remove(docId) {
  return await db.likes.deleteOne({ _id: docId })
}

async function removeByTrack(userId, trackId, source) {
  return await db.likes.deleteMany({ userId, trackId, source })
}

async function findOne(userId, trackId, source) {
  return await db.likes.findOne({ userId, trackId, source })
}

async function countByUser(userId) {
  return await db.likes.countDocuments({ userId })
}

module.exports = { getAll, add, remove, removeByTrack, countByUser, buildUserId }

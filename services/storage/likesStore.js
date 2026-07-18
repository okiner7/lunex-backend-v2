const db = require('./database')
const badgeStore = require('./badgeStore')

function buildUserId(provider, providerId) {
  return `${provider}_${providerId}`
}

async function getAll(userId) {
  return new Promise((resolve, reject) => {
    db.likes.find({ userId }).sort({ likedAt: -1 }).exec((err, docs) => {
      if (err) return reject(err)
      resolve(docs || [])
    })
  })
}

async function add(userId, track, providerId) {
  const existing = await findOne(userId, track.id, track.source)
  if (existing) {
    await remove(existing._id)
    return { liked: false }
  }
  const doc = {
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
  return new Promise((resolve, reject) => {
    db.likes.insert(doc, async (err) => {
      if (err) return reject(err)
      const count = await countByUser(userId)
      await badgeStore.checkAndGrantLikeBadges(providerId, count)
      resolve({ liked: true })
    })
  })
}

async function remove(docId) {
  return new Promise((resolve, reject) => {
    db.likes.remove({ _id: docId }, {}, (err, num) => {
      if (err) return reject(err)
      resolve(num)
    })
  })
}

async function removeByTrack(userId, trackId, source) {
  return new Promise((resolve, reject) => {
    db.likes.remove({ userId, trackId, source }, {}, (err, num) => {
      if (err) return reject(err)
      resolve(num)
    })
  })
}

async function findOne(userId, trackId, source) {
  return new Promise((resolve, reject) => {
    db.likes.findOne({ userId, trackId, source }, (err, doc) => {
      if (err) return reject(err)
      resolve(doc || null)
    })
  })
}

async function countByUser(userId) {
  return new Promise((resolve, reject) => {
    db.likes.count({ userId }, (err, count) => {
      if (err) return reject(err)
      resolve(count)
    })
  })
}

module.exports = { getAll, add, remove, removeByTrack, countByUser, buildUserId }

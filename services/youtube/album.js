const { ytmusic, init, safeArray } = require('./client')

async function getAlbum(id) {
  await init()
  return await ytmusic.getAlbum(id).catch(() => null)
}

async function getAlbumTracks(id) {
  await init()
  const album = await ytmusic.getAlbum(id).catch(() => null)
  return safeArray(album?.songs).map(t => ({
    id: t.videoId,
    title: t.name,
    artist: safeArray(t.artists).map(a => a.name).join(', '),
    artistId: safeArray(t.artists)?.[0]?.id || undefined,
    duration: (t.duration || 0) * 1000,
    artwork: t.thumbnails?.at(-1)?.url || null
  }))
}

module.exports = { getAlbum, getAlbumTracks }

const { ytmusic, init, safeArray } = require('./client')

async function getPlaylist(id) {
  await init()
  return await ytmusic.getPlaylist(id).catch(() => null)
}

async function getPlaylistTracks(id) {
  await init()
  const tracks = await ytmusic.getPlaylistVideos(id).catch(() => null)
  return safeArray(tracks).map(t => ({
    id: t.videoId,
    title: t.name,
    artist: safeArray(t.artists).map(a => a.name).join(', '),
    artistId: safeArray(t.artists)?.[0]?.id || undefined,
    duration: (t.duration || 0) * 1000,
    artwork: t.thumbnails?.at(-1)?.url || null
  }))
}

module.exports = { getPlaylist, getPlaylistTracks }

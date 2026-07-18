const { ytmusic, init, safeArray } = require('./client')

async function getArtistFull(id) {
  await init()
  const artist = await ytmusic.getArtist(id).catch(() => null)
  if (!artist) return null

  return {
    id,
    name: artist.name || null,
    avatar: artist.thumbnails?.at(-1)?.url || null,
    topSongs: safeArray(artist.topSongs).map(t => ({
      id: t.videoId,
      title: t.name,
      duration: (t.duration || 0) * 1000,
      artwork: t.thumbnails?.at(-1)?.url || null,
      artists: safeArray(t.artists).map(a => a.name),
      artistId: safeArray(t.artists)?.[0]?.id || id
    })),
    albums: safeArray(artist.topAlbums).map(a => ({
      id: a.albumId || a.browseId,
      title: a.name,
      artwork: a.thumbnails?.at(-1)?.url || null
    }))
  }
}

async function getArtistSongs(id) {
  await init()
  const songs = await ytmusic.getArtistSongs(id).catch(() => [])
  return safeArray(songs).map(t => ({
    id: t.videoId,
    source: 'youtube',
    title: t.name,
    artist: t.artist?.name || '',
    artistId: t.artist?.artistId || id,
    duration: (t.duration || 0) * 1000,
    artwork: t.thumbnails?.at(-1)?.url || null
  }))
}

module.exports = { getArtistFull, getArtistSongs }

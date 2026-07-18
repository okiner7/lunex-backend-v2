const { Router } = require('express')
const asyncHandler = require('../src/middleware/asyncHandler')
const yt = require('../services/youtube')
const { cacheMiddleware: cache } = require('../src/middleware/cache')

const router = Router()

router.get('/search', cache(7200), asyncHandler(async (req) => {
  const { q } = req.query
  if (!q) throw new Error('Query required')
  return await yt.search(q)
}))

router.get('/search-artists', cache(7200), asyncHandler(async (req) => {
  const { q } = req.query
  if (!q) throw new Error('Query required')
  return await yt.searchArtists(q)
}))

router.get('/search-playlists', cache(7200), asyncHandler(async (req) => {
  const { q } = req.query
  if (!q) throw new Error('Query required')
  return await yt.searchPlaylists(q)
}))


router.get('/artist', cache(21600), asyncHandler(async (req) => {
  const { id } = req.query
  if (!id) throw new Error('Artist ID required')
  return await yt.getArtist(id)
}))

router.get('/artist-full', cache(21600), asyncHandler(async (req) => {
  const { id } = req.query
  if (!id) throw new Error('Artist ID required')
  return await yt.getArtistFull(id)
}))

router.get('/artist-songs', cache(21600), asyncHandler(async (req) => {
  const { id } = req.query
  if (!id) throw new Error('Artist ID required')
  return await yt.getArtistSongs(id)
}))

router.get('/playlist', cache(3600), asyncHandler(async (req) => {
  const { id } = req.query
  if (!id) throw new Error('Playlist ID required')
  return await yt.getPlaylist(id)
}))

router.get('/playlist-tracks', cache(3600), asyncHandler(async (req) => {
  const { id } = req.query
  if (!id) throw new Error('Playlist ID required')
  return await yt.getPlaylistTracks(id)
}))

router.get('/album', cache(21600), asyncHandler(async (req) => {
  const { id } = req.query
  if (!id) throw new Error('Album ID required')
  return await yt.getAlbum(id)
}))

router.get('/album-tracks', cache(21600), asyncHandler(async (req) => {
  const { id } = req.query
  if (!id) throw new Error('Album ID required')
  return await yt.getAlbumTracks(id)
}))

router.get('/upnext', asyncHandler(async (req) => {
  const { id, history } = req.query
  if (!id) throw new Error('Video ID required')
  const historyIds = history ? history.split(',').filter(Boolean) : []
  return await yt.getUpNexts(id, historyIds)
}))

module.exports = router

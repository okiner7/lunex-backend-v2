const { fetchAll, getUserId } = require('./client')
const { formatPlaylist } = require('./formatters')

async function getUserPlaylistsById(id) {
  const collection = await fetchAll(`/users/${id}/playlists?limit=20`)
  return collection.map(formatPlaylist).filter(p => p !== null)
}

async function getUserPlaylists(profileUrl) {
  const userId = await getUserId(profileUrl)
  const collection = await fetchAll(`/users/${userId}/playlists?limit=50`)
  return collection.map(formatPlaylist).filter(p => p !== null)
}

async function getPlaylistTracks(playlistId) {
  const { request } = require('./client')
  const { formatTrack } = require('./formatters')
  const data = await request(`/playlists/${playlistId}`)
  if (!data || !data.tracks) return []
  return data.tracks.map(formatTrack).filter(t => t !== null && t.duration > 30000)
}

module.exports = { getUserPlaylistsById, getUserPlaylists, getPlaylistTracks }

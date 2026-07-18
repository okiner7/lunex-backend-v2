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

module.exports = { getUserPlaylistsById, getUserPlaylists }

const { request } = require('./client')
const { formatTrack, formatPlaylist } = require('./formatters')

async function search(q) {
  const data = await request('/search/tracks', { q, limit: 20 })
  return (data.collection || [])
    .map(formatTrack)
    .filter(t => t !== null && t.duration > 30000 && (!t.stream_url || !t.stream_url.includes('/preview/')))
}

async function searchUsers(q) {
  const data = await request('/search/users', { q, limit: 10 })
  return (data.collection || []).map(u => ({
    id: u.id,
    source: 'soundcloud',
    itemType: 'artist',
    title: u.username,
    artist: u.username,
    artwork: u.avatar_url?.replace('-large', '-t500x500') || null,
    followers_count: u.followers_count,
    track_count: u.track_count,
    verified: u.verified,
    city: u.city,
    description: u.description,
    url: u.permalink_url || ''
  }))
}

async function searchPlaylists(q) {
  const data = await request('/search/playlists', { q, limit: 10 })
  return (data.collection || []).map(formatPlaylist).filter(p => p !== null)
}

module.exports = { search, searchUsers, searchPlaylists }

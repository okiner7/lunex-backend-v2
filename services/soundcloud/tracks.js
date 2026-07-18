const { request, fetchAll } = require('./client')
const { formatTrack } = require('./formatters')

async function getUserTracksById(id) {
  const collection = await fetchAll(`/users/${id}/tracks?limit=20`)
  return collection.map(formatTrack).filter(t => t !== null)
}

async function getPlaylistTracks(playlistIdOrUrl) {
  try {
    let data
    const isUrl = String(playlistIdOrUrl).includes('soundcloud.com')
    if (isUrl) {
      const cleanUrl = decodeURIComponent(playlistIdOrUrl).split('?')[0]
      data = await request('/resolve', { url: cleanUrl })
    } else {
      data = await request(`/playlists/${playlistIdOrUrl}`)
    }
    if (!data || !data.id) throw new Error('Playlist not found')

    const allTrackIds = data.tracks ? data.tracks.map(t => t.id) : []
    if (allTrackIds.length === 0) return []

    let fullTracks = []
    try {
      const trackIdsString = allTrackIds.slice(0, 50).join(',')
      const response = await request('/tracks', { ids: trackIdsString })
      fullTracks = Array.isArray(response) ? response : (response.collection || [])
    } catch {
      fullTracks = data.tracks
    }

    return fullTracks.map(formatTrack).filter(t => t !== null && t.title !== 'Untitled Track')
  } catch (error) {
    console.error('SC_PLAYLIST_ERROR:', error.message)
    return []
  }
}
async function getRelatedTracks(trackId) {
  try {
    const data = await request(`/tracks/${trackId}/related`)
    if (!data || !data.collection) return []
    return data.collection.map(formatTrack).filter(t => t !== null && t.title !== 'Untitled Track')
  } catch (error) {
    console.error('SC_RELATED_ERROR:', error.message)
    return []
  }
}

async function searchTracksByArtist(artistName, limit = 20) {
  try {
    const { fetchAll } = require('./client')
    const { formatTrack } = require('./formatters')
    const encoded = encodeURIComponent(artistName)
    const collection = await fetchAll(`/search/tracks?q=${encoded}&limit=${limit}`)
    return collection.map(formatTrack).filter(t => t !== null && t.title !== 'Untitled Track')
  } catch (error) {
    console.error('SC_ARTIST_SEARCH_ERROR:', error.message)
    return []
  }
}

module.exports = { getUserTracksById, getPlaylistTracks, getRelatedTracks, searchTracksByArtist }

const { request, getUserId } = require('./client')

async function getUserById(id) {
  const user = await request(`/users/${id}`)
  if (!user) throw new Error('User not found')
  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar_url?.replace('-large', '-t500x500'),
    banner: user.visuals?.visuals?.[0]?.visual_url || null,
    description: user.description,
    followers_count: user.followers_count,
    track_count: user.track_count,
    verified: user.verified
  }
}

async function getUserInfo(profileUrl) {
  const user = await request('/resolve', { url: profileUrl })
  if (!user) throw new Error('User not found')
  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar_url?.replace('-large', '-t500x500'),
    banner: user.visuals?.visuals?.[0]?.visual_url || null,
    description: user.description,
    followers_count: user.followers_count,
    track_count: user.track_count,
    verified: user.verified
  }
}

async function getUserLikes(profileUrl) {
  const userId = await getUserId(profileUrl)
  const { formatTrack } = require('./formatters')
  const collection = await require('./client').fetchAll(`/users/${userId}/likes?limit=50`)
  return collection.filter(item => item.track).map(item => formatTrack(item.track)).filter(t => t !== null)
}

module.exports = { getUserById, getUserInfo, getUserLikes }

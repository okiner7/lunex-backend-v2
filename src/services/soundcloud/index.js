const client = require('./client')
const formatters = require('./formatters')
const search = require('./search')
const user = require('./user')
const tracks = require('./tracks')
const playlists = require('./playlists')

module.exports = { ...client, ...formatters, ...search, ...user, ...tracks, ...playlists }

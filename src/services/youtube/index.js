const client = require('./client')
const search = require('./search')
const artist = require('./artist')
const playlist = require('./playlist')
const album = require('./album')

module.exports = { ...client, ...search, ...artist, ...playlist, ...album }

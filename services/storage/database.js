const Datastore = require('@seald-io/nedb')
const path = require('path')

const DATA_DIR = path.join(__dirname, '..', '..', 'data')

const db = {}

db.users = new Datastore({ filename: path.join(DATA_DIR, 'users.db'), autoload: true })
db.likes = new Datastore({ filename: path.join(DATA_DIR, 'likes.db'), autoload: true })
db.playlists = new Datastore({ filename: path.join(DATA_DIR, 'playlists.db'), autoload: true })
db.settings = new Datastore({ filename: path.join(DATA_DIR, 'settings.db'), autoload: true })
db.searchHist = new Datastore({ filename: path.join(DATA_DIR, 'search_history.db'), autoload: true })
db.authCodes = new Datastore({ filename: path.join(DATA_DIR, 'auth_codes.db'), autoload: true })
db.listeningHist = new Datastore({ filename: path.join(DATA_DIR, 'listening_history.db'), autoload: true })
db.themes = new Datastore({ filename: path.join(DATA_DIR, 'themes.db'), autoload: true })
db.stats = new Datastore({ filename: path.join(DATA_DIR, 'stats.db'), autoload: true })
db.trackStats = new Datastore({ filename: path.join(DATA_DIR, 'track_stats.db'), autoload: true })

db.users.ensureIndex({ fieldName: 'providerId', unique: true })
db.likes.ensureIndex({ fieldName: 'userId' })
db.playlists.ensureIndex({ fieldName: 'ownerId' })
db.settings.ensureIndex({ fieldName: 'userId', unique: true })
db.searchHist.ensureIndex({ fieldName: 'userId' })
db.authCodes.ensureIndex({ fieldName: 'code', unique: true })
db.authCodes.ensureIndex({ fieldName: 'telegramId' })
db.listeningHist.ensureIndex({ fieldName: 'userId' })
db.trackStats.ensureIndex({ fieldName: 'id', unique: true })

module.exports = db

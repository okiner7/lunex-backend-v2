const { Router } = require('express')
const asyncHandler = require('../src/middleware/asyncHandler')
const authRequired = require('../src/middleware/authRequired')
const themeStore = require('../services/storage/themeStore')

const router = Router()

// Public endpoint to get all themes
router.get('/', asyncHandler(async (req, res) => {
  const themes = await themeStore.getAll()
  return themes
}))

// Protected endpoint to publish a theme
router.post('/', authRequired, asyncHandler(async (req) => {
  const { name, themeData } = req.body
  if (!name || !themeData) throw new Error('Name and themeData are required')
  
  const authorId = `${req.user.provider}_${req.user.provider_id}`
  const authorName = req.user.name || 'Аноним'
  
  return await themeStore.create(authorId, authorName, name, themeData)
}))

// Public endpoint to increment downloads
router.post('/:id/download', asyncHandler(async (req) => {
  await themeStore.incrementDownloads(req.params.id)
  return { success: true }
}))

module.exports = router

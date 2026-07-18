const { Router } = require('express')
const authRequired = require('../src/middleware/authRequired')

const router = Router()

router.get('/', authRequired, (req, res) => {
  res.json({ success: true, data: req.user })
})

module.exports = router

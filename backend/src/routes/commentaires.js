const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middleware/auth')
const { updateCommentaire, deleteCommentaire } = require('../controllers/commentairesController')

router.put('/:id', authMiddleware, updateCommentaire)
router.delete('/:id', authMiddleware, deleteCommentaire)

module.exports = router
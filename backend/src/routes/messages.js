const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middleware/auth')
const {
  getConversations,
  getMessages,
  sendMessage,
  deleteMessage,
  getNonLusCount,
  getUsers
} = require('../controllers/messagesController')

// Ordre important : routes spécifiques avant :userId
router.get('/users', authMiddleware, getUsers)
router.get('/non-lus/count', authMiddleware, getNonLusCount)
router.get('/conversations', authMiddleware, getConversations)
router.get('/:userId', authMiddleware, getMessages)
router.post('/', authMiddleware, sendMessage)
router.delete('/:id', authMiddleware, deleteMessage)

module.exports = router
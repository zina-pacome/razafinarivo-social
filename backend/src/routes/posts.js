const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middleware/auth')
const {
  getPosts, getPost, createPost, updatePost, deletePost, upload
} = require('../controllers/postsController')
const {
  getCommentaires, createCommentaire, updateCommentaire, deleteCommentaire
} = require('../controllers/commentairesController')

// Posts
router.get('/', authMiddleware, getPosts)
router.get('/:id', authMiddleware, getPost)
router.post('/', authMiddleware, upload.single('image'), createPost)
router.put('/:id', authMiddleware, updatePost)
router.delete('/:id', authMiddleware, deletePost)

// Commentaires
router.get('/:postId/commentaires', authMiddleware, getCommentaires)
router.post('/:postId/commentaires', authMiddleware, createCommentaire)

module.exports = router
const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middleware/auth')
const supabase = require('../config/supabase')
const { toggleReaction, getReactions } = require('../controllers/reactionsController')

router.get('/', authMiddleware, getReactions)
router.post('/', authMiddleware, toggleReaction)

// ⚠️ /detail AVANT /:id sinon Express confond les routes
router.get('/detail', authMiddleware, async (req, res) => {
  try {
    const { post_id, comment_id } = req.query

    if (!post_id && !comment_id) {
      return res.status(400).json({ message: 'post_id ou comment_id requis' })
    }

    // Réactions
    const { data: reactionData, error: reactionError } = await supabase
      .from('reactions')
      .select('type, user_id')
      .eq(post_id ? 'post_id' : 'comment_id', post_id || comment_id)

    if (reactionError) {
      console.error('Reaction error:', reactionError)
      return res.status(500).json({ message: reactionError.message })
    }

    if (!reactionData || reactionData.length === 0) {
      return res.json([])
    }

    // Users séparément
    const results = []
    for (const reaction of reactionData) {
      const { data: userData } = await supabase
        .from('users')
        .select('id, nom, photo_profil')
        .eq('id', reaction.user_id)
        .single()

      results.push({
        user_id: reaction.user_id,
        type: reaction.type,
        nom: userData?.nom || 'Membre',
        photo_profil: userData?.photo_profil || null
      })
    }

    console.log('Reactors result:', results)
    res.json(results)
  } catch (err) {
    console.error('Detail error:', err)
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
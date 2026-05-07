const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middleware/auth')
const supabase = require('../config/supabase')

// GET /api/notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id, type, lu, created_at,
        post_id, comment_id,
        from_user:users!notifications_from_user_id_fkey
          (id, nom, photo_profil)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// GET /api/notifications/count
router.get('/count', authMiddleware, async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', req.user.id)
      .eq('lu', false)

    if (error) throw error
    res.json({ count })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// PATCH /api/notifications/read-all
router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    await supabase
      .from('notifications')
      .update({ lu: true })
      .eq('user_id', req.user.id)
      .eq('lu', false)

    res.json({ message: 'Notifications lues' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    await supabase
      .from('notifications')
      .update({ lu: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)

    res.json({ message: 'OK' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

module.exports = router
const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middleware/auth')
const supabase = require('../config/supabase')

// GET /api/search?q=xxx
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query
    if (!q || q.trim().length < 2) {
      return res.json({ users: [], posts: [] })
    }

    const query = q.trim()

    // Recherche membres en parallèle
    const [usersResult, postsResult] = await Promise.all([
      supabase
        .from('users')
        .select('id, nom, email, photo_profil, en_ligne')
        .eq('statut', 'accepte')
        .ilike('nom', `%${query}%`)
        .neq('id', req.user.id)
        .limit(5),

      supabase
        .from('posts')
        .select(`
          id, contenu, image, created_at,
          users!posts_user_id_fkey (id, nom, photo_profil)
        `)
        .ilike('contenu', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(5)
    ])

    res.json({
      users: usersResult.data || [],
      posts: postsResult.data || []
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

module.exports = router
const express = require('express')
const router = express.Router()
const { authMiddleware, adminMiddleware } = require('../middleware/auth')
const supabase = require('../config/supabase')

// GET /api/admin/users — liste tous les users
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, nom, email, statut, role, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// PATCH /api/admin/users/:id/statut — accepter ou refuser
router.patch('/users/:id/statut', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { statut } = req.body
    if (!['accepte', 'refuse'].includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide' })
    }

    const { data, error } = await supabase
      .from('users')
      .update({ statut })
      .eq('id', req.params.id)
      .select('id, nom, email, statut')
      .single()

    if (error) throw error
    res.json({ message: `Compte ${statut}`, user: data })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
    // Si on accepte un nouveau membre → notifier tout le monde
    if (statut === 'accepte') {
      const { data: allUsers } = await supabase
        .from('users')
        .select('id')
        .eq('statut', 'accepte')
        .neq('id', req.params.id)

      if (allUsers?.length) {
        await supabase.from('notifications').insert(
          allUsers.map(u => ({
            user_id: u.id,
            from_user_id: req.params.id,
            type: 'nouveau_membre'
          }))
        )
      }
    }
})

// DELETE /api/admin/users/:id — supprimer un user
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ message: 'Utilisateur supprimé' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

module.exports = router
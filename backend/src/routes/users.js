const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middleware/auth')
const supabase = require('../config/supabase')
const multer = require('multer')

const upload = multer({ storage: multer.memoryStorage() })

// GET /api/users/:id — profil d'un user
// GET /api/users/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, nom, email, bio, photo_profil, photo_couverture, role, en_ligne, created_at')
      .eq('id', req.params.id)
      .single()

    if (error || !data) return res.status(404).json({ message: 'Utilisateur introuvable' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// GET /api/users/:id/posts — posts d'un user
router.get('/:id/posts', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, contenu, image, created_at, updated_at,
        users!posts_user_id_fkey (id, nom, photo_profil),
        commentaires (count),
        reactions (id, type, user_id)
      `)
      .eq('user_id', req.params.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// PUT /api/users/profile — modifier son profil
router.put('/profile', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const { nom, bio } = req.body
    let photo_profil = undefined

    // Upload avatar si fourni
    if (req.file) {
      const fileName = `avatars/${req.user.id}_${Date.now()}`
      const { error: uploadError } = await supabase.storage
        .from('razafinarivo')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true
        })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('razafinarivo')
        .getPublicUrl(fileName)
      photo_profil = urlData.publicUrl
    }

    const updates = {}
    if (nom) updates.nom = nom
    if (bio !== undefined) updates.bio = bio
    if (photo_profil) updates.photo_profil = photo_profil

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, nom, email, bio, photo_profil, role, en_ligne, created_at')
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// GET /api/users/search?q=xxx
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query
    if (!q || q.trim().length < 2) return res.json([])

    const { data, error } = await supabase
      .from('users')
      .select('id, nom, email, photo_profil, en_ligne')
      .eq('statut', 'accepte')
      .ilike('nom', `%${q}%`)
      .neq('id', req.user.id)
      .limit(6)

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// GET /api/users/mentions?q=xxx — pour l'autocomplete @mention
router.get('/mentions', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query
    if (!q || q.length < 1) return res.json([])

    const { data, error } = await supabase
      .from('users')
      .select('id, nom, photo_profil')
      .eq('statut', 'accepte')
      .ilike('nom', `%${q}%`)
      .neq('id', req.user.id)
      .limit(5)

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})
// PUT /api/users/cover
router.put('/cover', authMiddleware, upload.single('cover'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Image requise' })

    const fileName = `covers/${req.user.id}_${Date.now()}`
    await supabase.storage
      .from('razafinarivo')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      })

    const { data: urlData } = supabase.storage
      .from('razafinarivo')
      .getPublicUrl(fileName)

    const { data, error } = await supabase
      .from('users')
      .update({ photo_couverture: urlData.publicUrl })
      .eq('id', req.user.id)
      .select('photo_couverture')
      .single()

    if (error) throw error

    // Publier dans le feed
    await supabase.from('posts').insert({
      contenu: `📸 a mis à jour sa photo de couverture`,
      image: urlData.publicUrl,
      user_id: req.user.id
    })

    // Notifier les membres
    const { data: allUsers } = await supabase
      .from('users')
      .select('id')
      .eq('statut', 'accepte')
      .neq('id', req.user.id)

    if (allUsers?.length) {
      await supabase.from('notifications').insert(
        allUsers.map(u => ({
          user_id: u.id,
          from_user_id: req.user.id,
          type: 'photo_couverture'
        }))
      )
    }

    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})
// GET /api/users/by-name/:nom
// GET /api/users/by-name/:nom
router.get('/by-name/:nom', authMiddleware, async (req, res) => {
  try {
    // Remplacer underscore par espace
    const nom = decodeURIComponent(req.params.nom).replace(/_/g, ' ')
    console.log('Searching user by name:', nom)

    const { data, error } = await supabase
      .from('users')
      .select('id, nom, photo_profil')
      .ilike('nom', `%${nom}%`)
      .eq('statut', 'accepte')
      .limit(1)
      .single()

    if (error || !data) {
      console.log('User not found:', nom, error)
      return res.status(404).json({ message: 'Introuvable' })
    }
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})
// PUT /api/users/settings
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const { nom, email, ancien_mdp, nouveau_mdp } = req.body

    // Récupérer l'utilisateur actuel avec mot de passe
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single()

    if (fetchError || !currentUser) {
      return res.status(404).json({ message: 'Utilisateur introuvable' })
    }

    const updates = {}

    // Changer le nom
    if (nom && nom.trim() !== currentUser.nom) {
      updates.nom = nom.trim()
    }

    // Changer l'email
    if (email && email.trim() !== currentUser.email) {
      // Vérifier si l'email est déjà utilisé
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.trim())
        .neq('id', req.user.id)
        .single()

      if (existing) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' })
      }
      updates.email = email.trim()
    }

    // Changer le mot de passe
    if (nouveau_mdp) {
      if (!ancien_mdp) {
        return res.status(400).json({
          message: 'Ancien mot de passe requis'
        })
      }
      if (nouveau_mdp.length < 6) {
        return res.status(400).json({
          message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
        })
      }

      const bcrypt = require('bcryptjs')
      const valid = await bcrypt.compare(ancien_mdp, currentUser.mot_de_passe)
      if (!valid) {
        return res.status(400).json({ message: 'Ancien mot de passe incorrect' })
      }

      updates.mot_de_passe = await bcrypt.hash(nouveau_mdp, 10)
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'Aucune modification détectée' })
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, nom, email, bio, photo_profil, photo_couverture, role')
      .single()

    if (error) throw error
    res.json({ message: 'Paramètres mis à jour', user: data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})
// DELETE /api/users/account
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    await supabase.from('users').delete().eq('id', req.user.id)
    res.json({ message: 'Compte supprimé' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})
module.exports = router
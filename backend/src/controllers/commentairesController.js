const supabase = require('../config/supabase')

// Helper: créer une notification
const createNotif = async (userId, fromUserId, type, postId, commentId) => {
  if (userId === fromUserId) return
  await supabase.from('notifications').insert({
    user_id: userId,
    from_user_id: fromUserId,
    type,
    post_id: postId || null,
    comment_id: commentId || null
  })
}

// GET /api/posts/:postId/commentaires
const getCommentaires = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('commentaires')
      .select(`
        id, contenu, created_at, updated_at, parent_id, mentions,
        users!commentaires_user_id_fkey (id, nom, photo_profil),
        reactions (id, type, user_id)
      `)
      .eq('post_id', req.params.postId)
      .order('created_at', { ascending: true })

    if (error) throw error

    // Construire arbre parent/enfants
    const roots = []
    const map = {}
    data.forEach(c => { map[c.id] = { ...c, replies: [] } })
    data.forEach(c => {
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].replies.push(map[c.id])
      } else {
        roots.push(map[c.id])
      }
    })

    res.json(roots)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// POST /api/posts/:postId/commentaires
const createCommentaire = async (req, res) => {
  try {
    const { contenu, parent_id, mentions } = req.body
    console.log('New comment:', { contenu, parent_id, mentions })

    if (!contenu?.trim()) {
      return res.status(400).json({ message: 'Le contenu est requis' })
    }

    const { data, error } = await supabase
      .from('commentaires')
      .insert({
        contenu,
        user_id: req.user.id,
        post_id: req.params.postId,
        parent_id: parent_id || null,
        mentions: mentions || []
      })
      .select(`
        id, contenu, created_at, parent_id, mentions,
        users!commentaires_user_id_fkey (id, nom, photo_profil),
        reactions (id, type, user_id)
      `)
      .single()

    if (error) {
      console.error('Comment insert error:', error)
      throw error
    }

    // Notifier auteur du post
    const { data: post } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', req.params.postId)
      .single()

    if (post?.user_id && post.user_id !== req.user.id) {
      if (parent_id) {
        // Réponse → notifier auteur du commentaire parent
        const { data: parent } = await supabase
          .from('commentaires')
          .select('user_id')
          .eq('id', parent_id)
          .single()

        if (parent?.user_id) {
          await createNotif(
            parent.user_id, req.user.id,
            'reponse', req.params.postId, data.id
          )
        }
      } else {
        await createNotif(
          post.user_id, req.user.id,
          'commentaire', req.params.postId, data.id
        )
      }
    }

    // Notifier les mentions
    if (mentions && mentions.length > 0) {
      console.log('Sending mention notifications to:', mentions)
      for (const mentionedId of mentions) {
        if (mentionedId !== req.user.id) {
          await createNotif(
            mentionedId,
            req.user.id,
            'mention',
            req.params.postId,
            data.id
          )
        }
      }
    }

    res.status(201).json({ ...data, replies: [] })
  } catch (err) {
    console.error('createCommentaire error:', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// PUT /api/commentaires/:id
const updateCommentaire = async (req, res) => {
  try {
    const { contenu } = req.body
    const { data: existing } = await supabase
      .from('commentaires')
      .select('user_id')
      .eq('id', req.params.id)
      .single()

    if (!existing) return res.status(404).json({ message: 'Commentaire introuvable' })
    if (existing.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' })
    }

    const { data, error } = await supabase
      .from('commentaires')
      .update({ contenu, updated_at: new Date() })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// DELETE /api/commentaires/:id
const deleteCommentaire = async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('commentaires')
      .select('user_id')
      .eq('id', req.params.id)
      .single()

    if (!existing) return res.status(404).json({ message: 'Commentaire introuvable' })
    if (existing.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' })
    }

    await supabase.from('commentaires').delete().eq('id', req.params.id)
    res.json({ message: 'Commentaire supprimé' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

module.exports = {
  getCommentaires, createCommentaire,
  updateCommentaire, deleteCommentaire
}
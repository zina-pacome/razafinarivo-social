const supabase = require('../config/supabase')

const TYPES_VALIDES = ['like', 'love', 'haha', 'wow', 'sad', 'angry']

const createNotif = async (userId, fromUserId, type, postId, commentId) => {
  if (!userId || userId === fromUserId) return
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      from_user_id: fromUserId,
      type,
      post_id: postId || null,
      comment_id: commentId || null
    })
  } catch (err) {
    console.error('Notif error:', err)
  }
}

// POST /api/reactions
const toggleReaction = async (req, res) => {
  try {
    const { type, post_id, comment_id } = req.body

    if (!TYPES_VALIDES.includes(type)) {
      return res.status(400).json({ message: 'Type de réaction invalide' })
    }
    if (!post_id && !comment_id) {
      return res.status(400).json({ message: 'post_id ou comment_id requis' })
    }

    const matchField = post_id
      ? { post_id, user_id: req.user.id }
      : { comment_id, user_id: req.user.id }

    const { data: existing } = await supabase
      .from('reactions')
      .select('id, type')
      .match(matchField)
      .single()

    // Toggle off — même réaction
    if (existing?.type === type) {
      await supabase.from('reactions').delete().eq('id', existing.id)
      return res.json({ message: 'Réaction retirée', action: 'removed' })
    }

    // Update — autre réaction
    if (existing) {
      const { data, error } = await supabase
        .from('reactions')
        .update({ type })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error

      // Notifier le propriétaire
      if (post_id) {
        const { data: post } = await supabase
          .from('posts').select('user_id').eq('id', post_id).single()
        if (post) await createNotif(post.user_id, req.user.id, 'reaction_post', post_id, null)
      } else {
        const { data: comment } = await supabase
          .from('commentaires').select('user_id').eq('id', comment_id).single()
        if (comment) await createNotif(comment.user_id, req.user.id, 'reaction_comment', null, comment_id)
      }

      return res.json({ message: 'Réaction mise à jour', reaction: data, action: 'updated' })
    }

    // Insert — nouvelle réaction
    const { data, error } = await supabase
      .from('reactions')
      .insert({
        type,
        user_id: req.user.id,
        post_id: post_id || null,
        comment_id: comment_id || null
      })
      .select()
      .single()
    if (error) throw error

    // Notifier
    if (post_id) {
      const { data: post } = await supabase
        .from('posts').select('user_id').eq('id', post_id).single()
      if (post) await createNotif(post.user_id, req.user.id, 'reaction_post', post_id, null)
    } else {
      const { data: comment } = await supabase
        .from('commentaires').select('user_id').eq('id', comment_id).single()
      if (comment) await createNotif(comment.user_id, req.user.id, 'reaction_comment', null, comment_id)
    }

    res.status(201).json({ message: 'Réaction ajoutée', reaction: data, action: 'added' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// GET /api/reactions
const getReactions = async (req, res) => {
  try {
    const { post_id, comment_id } = req.query
    const matchField = post_id ? { post_id } : { comment_id }

    const { data, error } = await supabase
      .from('reactions')
      .select('type, user_id')
      .match(matchField)

    if (error) throw error

    const counts = TYPES_VALIDES.reduce((acc, t) => {
      acc[t] = data.filter(r => r.type === t).length
      return acc
    }, {})

    const userReaction = data.find(r => r.user_id === req.user.id)?.type || null
    res.json({ counts, userReaction, total: data.length })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

module.exports = { toggleReaction, getReactions }
const supabase = require('../config/supabase')

// GET /api/messages/conversations — liste toutes les conversations
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id

    // Récupérer tous les messages où l'user est impliqué
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id, contenu, created_at, lu,
        sender_id, receiver_id,
        sender:users!messages_sender_id_fkey (id, nom, photo_profil, en_ligne),
        receiver:users!messages_receiver_id_fkey (id, nom, photo_profil, en_ligne)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Grouper par conversation (interlocuteur unique)
    const conversationsMap = {}
    for (const msg of data) {
      const other = msg.sender_id === userId ? msg.receiver : msg.sender
      const otherId = other.id

      if (!conversationsMap[otherId]) {
        conversationsMap[otherId] = {
          interlocuteur: other,
          dernierMessage: msg,
          nonLus: 0
        }
      }

      // Compter les non lus reçus
      if (!msg.lu && msg.receiver_id === userId) {
        conversationsMap[otherId].nonLus++
      }
    }

    res.json(Object.values(conversationsMap))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// GET /api/messages/:userId — historique avec un user
const getMessages = async (req, res) => {
  try {
    const userId = req.user.id
    const otherId = req.params.userId
    const page = parseInt(req.query.page) || 1
    const limit = 30
    const offset = (page - 1) * limit

    const { data, error } = await supabase
      .from('messages')
      .select(`
        id, contenu, created_at, lu,
        sender:users!messages_sender_id_fkey (id, nom, photo_profil),
        receiver:users!messages_receiver_id_fkey (id, nom, photo_profil)
      `)
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${otherId}),` +
        `and(sender_id.eq.${otherId},receiver_id.eq.${userId})`
      )
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Marquer comme lus les messages reçus
    await supabase
      .from('messages')
      .update({ lu: true })
      .eq('sender_id', otherId)
      .eq('receiver_id', userId)
      .eq('lu', false)

    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// POST /api/messages — envoyer un message
const sendMessage = async (req, res) => {
  try {
    const { receiver_id, contenu } = req.body

    if (!receiver_id || !contenu?.trim()) {
      return res.status(400).json({ message: 'Destinataire et contenu requis' })
    }

    if (receiver_id === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous écrire à vous-même' })
    }

    // Vérifier que le destinataire existe et est accepté
    const { data: receiver, error: recvError } = await supabase
      .from('users')
      .select('id, nom, statut')
      .eq('id', receiver_id)
      .single()

    if (recvError || !receiver) {
      return res.status(404).json({ message: 'Destinataire introuvable' })
    }

    if (receiver.statut !== 'accepte') {
      return res.status(400).json({ message: 'Destinataire invalide' })
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        sender_id: req.user.id,
        receiver_id,
        contenu: contenu.trim(),
        lu: false
      })
      .select(`
        id, contenu, created_at, lu,
        sender:users!messages_sender_id_fkey (id, nom, photo_profil),
        receiver:users!messages_receiver_id_fkey (id, nom, photo_profil)
      `)
      .single()

    if (error) throw error
    res.status(201).json(message)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// DELETE /api/messages/:id — supprimer un message
const deleteMessage = async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('id', req.params.id)
      .single()

    if (!existing) return res.status(404).json({ message: 'Message introuvable' })
    if (existing.sender_id !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' })
    }

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ message: 'Message supprimé' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// GET /api/messages/non-lus/count — compteur non lus total
const getNonLusCount = async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('receiver_id', req.user.id)
      .eq('lu', false)

    if (error) throw error
    res.json({ nonLus: count })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// GET /api/messages/users — liste des users pour nouvelle conversation
const getUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, nom, photo_profil, en_ligne')
      .eq('statut', 'accepte')
      .neq('id', req.user.id)
      .order('nom', { ascending: true })

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  deleteMessage,
  getNonLusCount,
  getUsers
}
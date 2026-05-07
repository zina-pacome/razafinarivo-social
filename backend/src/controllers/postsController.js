const supabase = require('../config/supabase')
const multer = require('multer')
const path = require('path')

// Config upload image
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/
    const ext = allowed.test(path.extname(file.originalname).toLowerCase())
    const mime = allowed.test(file.mimetype)
    if (ext && mime) cb(null, true)
    else cb(new Error('Seules les images sont autorisées'))
  }
})

// Upload image vers Supabase Storage
const uploadImage = async (file, folder = 'posts') => {
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}`
  const { data, error } = await supabase.storage
    .from('razafinarivo')
    .upload(fileName, file.buffer, { contentType: file.mimetype })

  if (error) throw error

  const { data: urlData } = supabase.storage
    .from('razafinarivo')
    .getPublicUrl(fileName)

  return urlData.publicUrl
}

// GET /api/posts — fil d'actualité
const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = 10
    const offset = (page - 1) * limit

    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id, contenu, image, created_at, updated_at,
        users!posts_user_id_fkey (id, nom, photo_profil),
        commentaires (count),
        reactions (id, type, user_id)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    res.json(posts)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// GET /api/posts/:id — un post
const getPost = async (req, res) => {
  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        id, contenu, image, created_at, updated_at,
        users!posts_user_id_fkey (id, nom, photo_profil),
        commentaires (
          id, contenu, created_at, parent_id,
          users!commentaires_user_id_fkey (id, nom, photo_profil),
          reactions (id, type, user_id)
        ),
        reactions (id, type, user_id)
      `)
      .eq('id', req.params.id)
      .single()

    if (error || !post) return res.status(404).json({ message: 'Post introuvable' })
    res.json(post)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// POST /api/posts — créer un post
const createPost = async (req, res) => {
  try {
    const { contenu } = req.body
    if (!contenu?.trim()) {
      return res.status(400).json({ message: 'Le contenu est requis' })
    }

    let imageUrl = null
    if (req.file) {
      imageUrl = await uploadImage(req.file, 'posts')
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert({ contenu, image: imageUrl, user_id: req.user.id })
      .select(`
        id, contenu, image, created_at,
        users!posts_user_id_fkey (id, nom, photo_profil)
      `)
      .single()

    if (error) throw error
    res.status(201).json(post)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// PUT /api/posts/:id — modifier un post
const updatePost = async (req, res) => {
  try {
    const { contenu } = req.body

    // Vérifier propriétaire
    const { data: existing } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', req.params.id)
      .single()

    if (!existing) return res.status(404).json({ message: 'Post introuvable' })
    if (existing.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' })
    }

    const { data: post, error } = await supabase
      .from('posts')
      .update({ contenu, updated_at: new Date() })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json(post)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// DELETE /api/posts/:id — supprimer un post
const deletePost = async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', req.params.id)
      .single()

    if (!existing) return res.status(404).json({ message: 'Post introuvable' })
    if (existing.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' })
    }

    const { error } = await supabase.from('posts').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ message: 'Post supprimé' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

module.exports = { getPosts, getPost, createPost, updatePost, deletePost, upload }
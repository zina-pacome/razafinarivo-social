const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const supabase = require('../config/supabase')

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { nom, email, mot_de_passe } = req.body

    if (!nom || !email || !mot_de_passe) {
      return res.status(400).json({ message: 'Tous les champs sont requis' })
    }

    // Vérifier si email déjà utilisé
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' })
    }

    // Hasher le mot de passe
    const hash = await bcrypt.hash(mot_de_passe, 10)

    // Créer l'utilisateur
    const { data: user, error } = await supabase
      .from('users')
      .insert({ nom, email, mot_de_passe: hash, statut: 'en_attente', role: 'user' })
      .select('id, nom, email, statut')
      .single()

    if (error) throw error

    res.status(201).json({
      message: 'Inscription réussie. En attente de validation par l\'administrateur.',
      user: { id: user.id, nom: user.nom, email: user.email, statut: user.statut }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body

    if (!email || !mot_de_passe) {
      return res.status(400).json({ message: 'Email et mot de passe requis' })
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' })
    }

    const validPassword = await bcrypt.compare(mot_de_passe, user.mot_de_passe)
    if (!validPassword) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' })
    }

    if (user.statut === 'en_attente') {
      return res.status(403).json({ message: 'Votre compte est en attente de validation' })
    }

    if (user.statut === 'refuse') {
      return res.status(403).json({ message: 'Votre demande d\'accès a été refusée' })
    }

    // Mettre à jour statut en ligne
    await supabase.from('users').update({ en_ligne: true }).eq('id', user.id)

    const token = generateToken(user)

    res.json({
      token,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        photo_profil: user.photo_profil,
        bio: user.bio
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    await supabase.from('users').update({ en_ligne: false }).eq('id', req.user.id)
    res.json({ message: 'Déconnecté avec succès' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// GET /api/auth/me
const me = async (req, res) => {
  res.json({ user: req.user })
}

module.exports = { register, login, logout, me }
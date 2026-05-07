const jwt = require('jsonwebtoken')
const supabase = require('../config/supabase')

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token manquant' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const { data: user, error } = await supabase
      .from('users')
      .select('id, nom, email, role, statut, photo_profil')
      .eq('id', decoded.id)
      .single()

    if (error || !user) {
      return res.status(401).json({ message: 'Utilisateur introuvable' })
    }

    if (user.statut !== 'accepte') {
      return res.status(403).json({ message: 'Compte non validé par l\'administrateur' })
    }

    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide' })
  }
}

const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Accès réservé aux administrateurs' })
  }
  next()
}

module.exports = { authMiddleware, adminMiddleware }
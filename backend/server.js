const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://razafinarivo.vercel.app', // ← ton domaine Vercel
    /\.vercel\.app$/                   // ← tous les previews Vercel
  ],
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', require('./src/routes/auth'))
app.use('/api/admin', require('./src/routes/admin'))
app.use('/api/posts', require('./src/routes/posts'))
app.use('/api/commentaires', require('./src/routes/commentaires'))
app.use('/api/reactions', require('./src/routes/reactions'))
app.use('/api/messages', require('./src/routes/messages'))
app.use('/api/users', require('./src/routes/users'))
app.use('/api/notifications', require('./src/routes/notifications'))
app.use('/api/search', require('./src/routes/search'))
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', project: 'Razafinarivo Social' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Serveur Razafinarivo démarré sur le port ${PORT}`)
})
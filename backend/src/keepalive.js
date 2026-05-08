const https = require('https')

const BACKEND_URL = process.env.RENDER_URL

const keepAlive = () => {
  if (!BACKEND_URL) return
  setInterval(() => {
    https.get(`${BACKEND_URL}/api/health`, (res) => {
      console.log(`Keep-alive ping: ${res.statusCode}`)
    }).on('error', (err) => {
      console.error('Keep-alive error:', err.message)
    })
  }, 14 * 60 * 1000) // toutes les 14 minutes
}

module.exports = keepAlive
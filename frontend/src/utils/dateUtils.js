export const formatDistanceToNow = (dateString) => {
  if (!dateString) return ''

  // Supabase renvoie UTC — on force l'interprétation UTC
  const raw = dateString.endsWith('Z') ? dateString : dateString + 'Z'
  const date = new Date(raw)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000) // secondes

  if (diff < 10)  return 'À l\'instant'
  if (diff < 60)  return `Il y a ${diff} sec`
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)} j`

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

export const formatTime = (dateString) => {
  if (!dateString) return ''
  const raw = dateString.endsWith('Z') ? dateString : dateString + 'Z'
  const date = new Date(raw)
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatDate = (dateString) => {
  if (!dateString) return ''
  const raw = dateString.endsWith('Z') ? dateString : dateString + 'Z'
  const date = new Date(raw)
  const now = new Date()
  const diff = Math.floor((now - date) / 86400000)

  if (diff === 0) return 'Aujourd\'hui'
  if (diff === 1) return 'Hier'
  if (diff < 7) return date.toLocaleDateString('fr-FR', { weekday: 'long' })

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}
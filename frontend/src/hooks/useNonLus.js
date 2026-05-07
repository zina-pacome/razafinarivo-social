import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export const useNonLus = (userId, token) => {
  const [count, setCount] = useState(0)

  const fetchCount = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/messages/non-lus/count', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setCount(data.nonLus || 0)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (!userId || !token) return

    fetchCount()

    const channelName = `nonlus_${userId}`

    // Supprimer le channel existant s'il existe déjà
    const existing = supabase.getChannels()
      .find(c => c.topic === `realtime:${channelName}`)
    if (existing) {
      supabase.removeChannel(existing)
    }

    // Créer un nouveau channel propre
    const channel = supabase
      .channel(channelName, { config: { broadcast: { self: false } } })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        },
        () => fetchCount()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return { count, refetch: fetchCount }
}
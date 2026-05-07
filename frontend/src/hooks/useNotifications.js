import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import axios from 'axios'

export const useNotifications = (userId, token) => {
  const [count, setCount] = useState(0)
  const [notifications, setNotifications] = useState([])

  const fetchCount = async () => {
    if (!token) return
    try {
      const { data } = await axios.get('/api/notifications/count')
      setCount(data.count || 0)
    } catch {}
  }

  const fetchAll = async () => {
    if (!token) return
    try {
      const { data } = await axios.get('/api/notifications')
      setNotifications(data)
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await axios.patch('/api/notifications/read-all')
      setCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })))
    } catch {}
  }

  useEffect(() => {
    if (!userId || !token) return

    fetchCount()

    const channelName = `notifs_${userId}`

    // Supprimer le channel existant s'il existe déjà
    const existing = supabase.getChannels()
      .find(c => c.topic === `realtime:${channelName}`)
    if (existing) {
      supabase.removeChannel(existing)
    }

    const channel = supabase
      .channel(channelName, { config: { broadcast: { self: false } } })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        () => fetchCount()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return { count, notifications, fetchAll, markAllRead }
}
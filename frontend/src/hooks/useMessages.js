import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const useMessages = (userId, otherId, token) => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchMessages = useCallback(async () => {
    if (!otherId || !token) return
    try {
      const res = await fetch(`/api/messages/${otherId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setMessages(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [otherId, token])

  useEffect(() => {
    setLoading(true)
    setMessages([])
    fetchMessages()
  }, [fetchMessages])

  useEffect(() => {
    if (!userId || !otherId) return

    const channelName = `messages_${userId}_${otherId}`

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
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        },
        (payload) => {
          const newMsg = payload.new
          if (
            (newMsg.sender_id === otherId && newMsg.receiver_id === userId) ||
            (newMsg.sender_id === userId && newMsg.receiver_id === otherId)
          ) {
            setMessages(prev => {
              const exists = prev.find(m => m.id === newMsg.id)
              if (exists) return prev
              return [...prev, newMsg]
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, otherId])

  const sendMessage = async (contenu) => {
    if (!token) return null
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ receiver_id: otherId, contenu })
      })
      const data = await res.json()
      if (res.ok) {
        setMessages(prev => {
          const exists = prev.find(m => m.id === data.id)
          if (exists) return prev
          return [...prev, data]
        })
        return data
      }
      return null
    } catch (err) {
      console.error(err)
      return null
    }
  }

  return { messages, loading, sendMessage, refetch: fetchMessages }
}
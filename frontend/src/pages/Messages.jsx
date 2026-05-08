import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api' 
import ConversationList from '../components/messaging/ConversationList'
import ChatWindow from '../components/messaging/ChatWindow'
import NewConversation from '../components/messaging/NewConversation'
import { MessageCircle } from 'lucide-react'

export default function Messages() {
  const { userId } = useParams()
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (userId) {
      fetchUserInfo(userId)
    }
  }, [userId])

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/api/messages/conversations')
      setConversations(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setConversations([])
    } finally {
      setLoading(false)
    }
  }
  const fetchUserInfo = async (id) => {
    try {
      const { data } = await api.get('/api/messages/users')
      const found = data.find(u => u.id === id)
      if (found) setSelectedUser(found)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSelectConversation = (interlocuteur) => {
    setSelectedUser(interlocuteur)
    setShowNew(false)
    navigate(`/messages/${interlocuteur.id}`)
    // Marquer comme lu dans la liste
    setConversations(prev => prev.map(c =>
      c.interlocuteur.id === interlocuteur.id ? { ...c, nonLus: 0 } : c
    ))
  }

  const handleNewMessage = (message) => {
    setConversations(prev => {
      const exists = prev.find(c => c.interlocuteur.id === selectedUser?.id)
      if (exists) {
        return prev.map(c =>
          c.interlocuteur.id === selectedUser?.id
            ? { ...c, dernierMessage: message, nonLus: 0 }
            : c
        )
      }
      return [{
        interlocuteur: selectedUser,
        dernierMessage: message,
        nonLus: 0
      }, ...prev]
    })
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="card overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
        <div className="flex h-full">

          {/* Sidebar conversations */}
          <div className="w-72 shrink-0 border-r border-gray-100 flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Messages</h2>
              <button
                onClick={() => { setShowNew(true); setSelectedUser(null) }}
                className="btn-primary text-xs px-3 py-1.5"
              >
                + Nouveau
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ConversationList
                conversations={conversations}
                selectedId={selectedUser?.id}
                currentUserId={user?.id}
                onSelect={handleSelectConversation}
                loading={loading}
              />
            </div>
          </div>

          {/* Zone chat */}
          <div className="flex-1 flex flex-col min-w-0">
            {showNew ? (
              <NewConversation
                onSelect={handleSelectConversation}
                onCancel={() => setShowNew(false)}
              />
            ) : selectedUser ? (
              <ChatWindow
                currentUser={user}
                otherUser={selectedUser}
                token={token}
                onNewMessage={handleNewMessage}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center
                              text-gray-300 gap-3">
                <MessageCircle size={48} strokeWidth={1} />
                <p className="text-sm">Sélectionnez une conversation</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
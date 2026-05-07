import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMessages } from '../../hooks/useMessages'
import { Send, Loader2, Trash2, ArrowLeft } from 'lucide-react'
import { formatTime, formatDate } from '../../utils/dateUtils'
import axios from 'axios'

export default function ChatWindow({ currentUser, otherUser, token, onNewMessage }) {
  const { messages, loading, sendMessage } = useMessages(
    currentUser?.id, otherUser?.id, token
  )
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef()
  const navigate = useNavigate()

  // Scroll automatique vers le bas à chaque nouveau message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e?.preventDefault()
    if (!input.trim() || sending) return
    setSending(true)
    try {
      const msg = await sendMessage(input.trim())
      if (msg) onNewMessage(msg)
      setInput('')
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (msgId) => {
    if (!confirm('Supprimer ce message ?')) return
    try {
      await axios.delete(`/api/messages/${msgId}`)
    } catch (err) {
      console.error(err)
    }
  }

  // Grouper les messages par date (avec fix UTC)
  const groupedMessages = groupByDate(messages)

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="p-4 border-b border-gray-100 flex items-center gap-3
                      bg-white shrink-0">
        {/* Retour mobile */}
        <button
          onClick={() => navigate('/messages')}
          className="text-gray-400 hover:text-gray-600 md:hidden
                     p-1 rounded-lg hover:bg-gray-100 transition-all"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Infos interlocuteur */}
        <Link
          to={`/profile/${otherUser.id}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center
                            justify-center overflow-hidden shrink-0">
              {otherUser.photo_profil ? (
                <img
                  src={otherUser.photo_profil}
                  className="w-full h-full object-cover"
                  alt={otherUser.nom}
                />
              ) : (
                <span className="text-primary-700 font-bold text-sm">
                  {otherUser.nom?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {/* Indicateur en ligne */}
            {otherUser.en_ligne && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500
                               rounded-full border-2 border-white" />
            )}
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">
              {otherUser.nom}
            </p>
            <p className="text-xs">
              {otherUser.en_ligne ? (
                <span className="text-green-500 font-medium">En ligne</span>
              ) : (
                <span className="text-gray-400">Hors ligne</span>
              )}
            </p>
          </div>
        </Link>
      </div>

      {/* ── Zone messages ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full py-8">
            <Loader2 size={24} className="animate-spin text-gray-300" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full
                          text-gray-300 gap-2 py-12">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center
                            justify-center mb-2">
              <Send size={20} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">
              Commencez la conversation !
            </p>
            <p className="text-xs text-gray-300">
              Envoyez un message à {otherUser.nom}
            </p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>

              {/* Séparateur date */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400 shrink-0 bg-gray-50
                                 px-3 py-1 rounded-full border border-gray-100">
                  {date}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Messages du groupe */}
              <div className="space-y-1.5">
                {msgs.map((msg, i) => {
                  const isMe = msg.sender_id === currentUser?.id ||
                               msg.sender?.id === currentUser?.id
                  const showAvatar = !isMe && (
                    i === 0 ||
                    msgs[i - 1]?.sender_id !== msg.sender_id
                  )
                  // Regrouper les messages consécutifs du même envoyeur
                  const isLastInGroup = i === msgs.length - 1 ||
                    msgs[i + 1]?.sender_id !== msg.sender_id

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2
                                  ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* Avatar interlocuteur */}
                      <div className="w-7 shrink-0">
                        {!isMe && showAvatar ? (
                          <div className="w-7 h-7 rounded-full bg-primary-100
                                          flex items-center justify-center
                                          overflow-hidden">
                            {otherUser.photo_profil ? (
                              <img
                                src={otherUser.photo_profil}
                                className="w-full h-full object-cover"
                                alt={otherUser.nom}
                              />
                            ) : (
                              <span className="text-primary-700 font-bold text-xs">
                                {otherUser.nom?.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                        ) : null}
                      </div>

                      {/* Bulle message */}
                      <div className="group relative max-w-xs lg:max-w-md">
                        <div
                          className={`px-3.5 py-2 text-sm leading-relaxed
                                      ${isMe
                                        ? `bg-primary-600 text-white
                                           ${isLastInGroup
                                             ? 'rounded-2xl rounded-br-sm'
                                             : 'rounded-2xl'}`
                                        : `bg-gray-100 text-gray-800
                                           ${isLastInGroup
                                             ? 'rounded-2xl rounded-bl-sm'
                                             : 'rounded-2xl'}`
                                      }`}
                        >
                          {msg.contenu}
                        </div>

                        {/* Heure + statut lu */}
                        {isLastInGroup && (
                          <div className={`flex items-center gap-1 mt-0.5
                                           ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-xs text-gray-400">
                              {formatTime(msg.created_at)}
                            </span>
                            {isMe && (
                              <span className={`text-xs font-medium
                                               ${msg.lu
                                                 ? 'text-primary-500'
                                                 : 'text-gray-300'
                                               }`}>
                                {msg.lu ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Bouton supprimer au hover — seulement mes messages */}
                        {isMe && (
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="absolute -left-7 top-1/2 -translate-y-1/2
                                       opacity-0 group-hover:opacity-100
                                       text-gray-300 hover:text-red-400
                                       transition-all p-1 rounded-lg
                                       hover:bg-red-50"
                            title="Supprimer"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input message ───────────────────────────────────────────────────── */}
      <div className="p-4 border-t border-gray-100 bg-white shrink-0">
        <div className="flex gap-3 items-end">
          <textarea
            value={input}
            onChange={e => {
              setInput(e.target.value)
              // Auto-resize
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend(e)
              }
            }}
            placeholder="Écrire un message... (Entrée pour envoyer)"
            rows={1}
            className="input-field resize-none flex-1 py-2.5 text-sm
                       overflow-hidden"
            style={{ minHeight: '42px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="btn-primary p-2.5 shrink-0 self-end"
            title="Envoyer"
          >
            {sending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-300 mt-1.5 text-right">
          Shift + Entrée pour sauter une ligne
        </p>
      </div>
    </>
  )
}

// ── Grouper par date avec fix UTC ─────────────────────────────────────────────
const groupByDate = (messages) => {
  return messages.reduce((groups, msg) => {
    const label = formatDate(msg.created_at)
    if (!groups[label]) groups[label] = []
    groups[label].push(msg)
    return groups
  }, {})
}
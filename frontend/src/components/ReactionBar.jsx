import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { ThumbsUp, X } from 'lucide-react'

const REACTIONS = [
  { type: 'like',  emoji: '👍', label: 'J\'aime',  color: 'text-blue-500' },
  { type: 'love',  emoji: '❤️', label: 'J\'adore', color: 'text-red-500' },
  { type: 'haha',  emoji: '😂', label: 'Haha',     color: 'text-yellow-500' },
  { type: 'wow',   emoji: '😮', label: 'Wow',      color: 'text-yellow-500' },
  { type: 'sad',   emoji: '😢', label: 'Triste',   color: 'text-blue-400' },
  { type: 'angry', emoji: '😡', label: 'Grrr',     color: 'text-orange-500' },
]

export default function ReactionBar({ postId, commentId, initialReactions, currentUserId }) {
  const [showPicker, setShowPicker] = useState(false)
  const [showReactors, setShowReactors] = useState(false)
  const [reactions, setReactions] = useState(initialReactions || [])
  const [reactorsDetail, setReactorsDetail] = useState([])
  const [loadingReactors, setLoadingReactors] = useState(false)
  const [userReaction, setUserReaction] = useState(
    initialReactions?.find(r => r.user_id === currentUserId)?.type || null
  )
  const pickerRef = useRef()
  const timerRef = useRef()

  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleReaction = async (type) => {
    setShowPicker(false)
    try {
      const payload = { type }
      if (postId) payload.post_id = postId
      if (commentId) payload.comment_id = commentId

      const { data } = await axios.post('/api/reactions', payload)

      if (data.action === 'removed') {
        setReactions(prev => prev.filter(r => r.user_id !== currentUserId))
        setUserReaction(null)
      } else if (data.action === 'updated') {
        setReactions(prev => prev.map(r =>
          r.user_id === currentUserId ? { ...r, type } : r
        ))
        setUserReaction(type)
      } else {
        setReactions(prev => [...prev, {
          type, user_id: currentUserId, id: data.reaction?.id
        }])
        setUserReaction(type)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleShowReactors = async () => {
    if (reactions.length === 0) return
    setShowReactors(true)
    setLoadingReactors(true)
    try {
      const param = postId ? `post_id=${postId}` : `comment_id=${commentId}`
      const { data } = await axios.get(`/api/reactions/detail?${param}`)
      setReactorsDetail(data)
    } catch {}
    finally { setLoadingReactors(false) }
  }

  // Compter par type
  const counts = REACTIONS.reduce((acc, r) => {
    const count = reactions.filter(rx => rx.type === r.type).length
    if (count > 0) acc.push({ ...r, count })
    return acc
  }, [])

  const total = reactions.length
  const currentReaction = REACTIONS.find(r => r.type === userReaction)

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Bouton réaction */}
        <div
          ref={pickerRef}
          className="relative"
          onMouseEnter={() => {
            clearTimeout(timerRef.current)
            setShowPicker(true)
          }}
          onMouseLeave={() => {
            timerRef.current = setTimeout(() => setShowPicker(false), 300)
          }}
        >
          <button
            onClick={() => userReaction
              ? handleReaction(userReaction)
              : handleReaction('like')
            }
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg
                        transition-all text-xs font-medium
                        ${userReaction
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-400 hover:text-primary-600 hover:bg-primary-50'
                        }`}
          >
            {currentReaction
              ? <span className="text-base leading-none">{currentReaction.emoji}</span>
              : <ThumbsUp size={14} />
            }
            <span className={currentReaction?.color || ''}>
              {currentReaction?.label || 'J\'aime'}
            </span>
          </button>

          {/* Picker hover */}
          {showPicker && (
            <div className="absolute bottom-9 left-0 bg-white rounded-2xl shadow-xl
                            border border-gray-100 px-2 py-1.5 flex gap-1 z-20
                            animate-fade-in">
              {REACTIONS.map(r => (
                <button
                  key={r.type}
                  onClick={() => handleReaction(r.type)}
                  title={r.label}
                  className={`text-xl hover:scale-125 transition-transform p-1
                              rounded-lg hover:bg-gray-50
                              ${userReaction === r.type ? 'scale-125' : ''}`}
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Compteurs cliquables */}
        {counts.length > 0 && (
          <button
            onClick={handleShowReactors}
            className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1
                       rounded-lg transition-all group"
            title="Voir les réactions"
          >
            <div className="flex -space-x-1">
              {counts.slice(0, 3).map(r => (
                <span key={r.type} className="text-sm leading-none">{r.emoji}</span>
              ))}
            </div>
            <span className="text-xs text-gray-400 group-hover:text-gray-600">
              {total}
            </span>
          </button>
        )}
      </div>

      {/* Modal réacteurs */}
      {showReactors && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center
                        justify-center p-4 animate-fade-in"
             onClick={() => setShowReactors(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm
                          overflow-hidden animate-slide-up"
               onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4
                            border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Réactions</h3>
              <button
                onClick={() => setShowReactors(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg
                           hover:bg-gray-100 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs par type */}
            <div className="flex border-b border-gray-100 overflow-x-auto">
              <TabBtn label="Tous" count={total} active />
              {counts.map(r => (
                <TabBtn key={r.type} label={r.emoji} count={r.count} />
              ))}
            </div>

            {/* Liste */}
            <div className="max-h-72 overflow-y-auto p-3 space-y-1">
              {loadingReactors ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-2 border-gray-200
                                  border-t-primary-500 rounded-full animate-spin" />
                </div>
              ) : reactorsDetail.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">
                  Aucun réacteur
                </p>
              ) : (
                reactorsDetail.map(r => (
                  <div key={r.user_id}
                       className="flex items-center justify-between px-3 py-2
                                  rounded-xl hover:bg-gray-50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-100
                                      flex items-center justify-center
                                      overflow-hidden shrink-0">
                        {r.photo_profil
                          ? <img src={r.photo_profil}
                                 className="w-full h-full object-cover" />
                          : <span className="text-primary-700 font-bold text-xs">
                              {r.nom?.charAt(0).toUpperCase()}
                            </span>
                        }
                      </div>
                      <span className="text-sm font-medium text-gray-800">
                        {r.nom}
                      </span>
                    </div>
                    <span className="text-xl">
                      {REACTIONS.find(rx => rx.type === r.type)?.emoji}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const TabBtn = ({ label, count, active }) => (
  <button className={`px-3 py-2 text-xs font-medium whitespace-nowrap
                      border-b-2 transition-all
                      ${active
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}>
    {label} {count}
  </button>
)
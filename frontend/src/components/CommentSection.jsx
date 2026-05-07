import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import api from '../lib/api' 
import {
  Send, Trash2, Edit3, Loader2,
  CornerDownRight, ChevronDown, ChevronUp
} from 'lucide-react'
import ReactionBar from './ReactionBar'
import { formatDistanceToNow } from '../utils/dateUtils'

export default function CommentSection({ postId, onCountChange }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [replyTo, setReplyTo] = useState(null) // { id, nom }
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')

  useEffect(() => { fetchComments() }, [postId])

  const fetchComments = async () => {
    try {
      const { data } = await api.get(`/api/posts/${postId}/commentaires`)
      setComments(data)
      const total = countAll(data)
      onCountChange(total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const countAll = (nodes) => {
    let n = 0
    for (const c of nodes) {
      n += 1 + countAll(c.replies || [])
    }
    return n
  }

  const handleNewComment = (newComment) => {
    if (newComment.parent_id) {
      setComments(prev => addReply(prev, newComment.parent_id, newComment))
    } else {
      setComments(prev => [...prev, newComment])
    }
    onCountChange(c => c + 1)
  }

  const addReply = (nodes, parentId, reply) =>
    nodes.map(n => n.id === parentId
      ? { ...n, replies: [...(n.replies || []), reply] }
      : { ...n, replies: addReply(n.replies || [], parentId, reply) }
    )

  const handleDelete = async (commentId) => {
    if (!confirm('Supprimer ce commentaire ?')) return
    await api.delete(`/api/commentaires/${commentId}`)
    setComments(prev => removeNode(prev, commentId))
    onCountChange(c => c - 1)
  }

  const removeNode = (nodes, id) =>
    nodes.filter(n => n.id !== id)
         .map(n => ({ ...n, replies: removeNode(n.replies || [], id) }))

  const handleUpdate = async (commentId) => {
    const { data } = await api.put(`/api/commentaires/${commentId}`, {
      contenu: editContent
    })
    setComments(prev => updateNode(prev, commentId, data.contenu))
    setEditingId(null)
  }

  const updateNode = (nodes, id, contenu) =>
    nodes.map(n => n.id === id
      ? { ...n, contenu }
      : { ...n, replies: updateNode(n.replies || [], id, contenu) }
    )

  if (loading) return (
    <div className="flex justify-center p-4">
      <Loader2 size={20} className="animate-spin text-gray-300" />
    </div>
  )

  return (
    <div className="p-4 space-y-3">
      {comments.map(comment => (
        <CommentNode
          key={comment.id}
          comment={comment}
          currentUser={user}
          postId={postId}
          depth={0}
          replyTo={replyTo}
          setReplyTo={setReplyTo}
          editingId={editingId}
          setEditingId={setEditingId}
          editContent={editContent}
          setEditContent={setEditContent}
          onNewComment={handleNewComment}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      ))}

      {/* Nouveau commentaire racine */}
      {!replyTo && (
        <CommentInput
          postId={postId}
          parentId={null}
          currentUser={user}
          onSubmit={handleNewComment}
          placeholder="Écrire un commentaire..."
        />
      )}
    </div>
  )
}

// ─── Noeud commentaire récursif ───────────────────────────────────────────────
function CommentNode({
  comment, currentUser, postId, depth,
  replyTo, setReplyTo,
  editingId, setEditingId, editContent, setEditContent,
  onNewComment, onDelete, onUpdate
}) {
  const [showReplies, setShowReplies] = useState(true)
  const hasReplies = comment.replies?.length > 0
  const isReplying = replyTo?.id === comment.id

  return (
    <div className={`flex gap-2.5 ${depth > 0 ? 'ml-8 mt-2' : ''}`}>
      {/* Ligne verticale pour les branches */}
      {depth > 0 && (
        <div className="absolute -left-4 top-0 bottom-0 w-px bg-gray-100" />
      )}

      <Link to={`/profile/${comment.users?.id}`} className="shrink-0 mt-0.5">
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center
                        justify-center overflow-hidden">
          {comment.users?.photo_profil
            ? <img src={comment.users.photo_profil}
                   className="w-full h-full object-cover" />
            : <span className="text-primary-700 font-bold text-xs">
                {comment.users?.nom?.charAt(0).toUpperCase()}
              </span>
          }
        </div>
      </Link>

      <div className="flex-1 min-w-0 relative">
        <div className="bg-gray-50 rounded-2xl px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <Link
              to={`/profile/${comment.users?.id}`}
              className="font-semibold text-xs text-gray-900 hover:underline"
            >
              {comment.users?.nom}
            </Link>
            <span className="text-xs text-gray-400 shrink-0">
              {formatDistanceToNow(comment.created_at)}
            </span>
          </div>

          {editingId === comment.id ? (
            <div className="mt-1 space-y-1">
              <input
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="input-field text-xs py-1.5"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && onUpdate(comment.id)}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingId(null)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Annuler
                </button>
                <button
                  onClick={() => onUpdate(comment.id)}
                  className="text-xs text-primary-600 font-medium hover:underline"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">
              {renderMentions(comment.contenu)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-2 mt-1 flex-wrap">
          <ReactionBar
            commentId={comment.id}
            initialReactions={comment.reactions || []}
            currentUserId={currentUser?.id}
          />

          <button
            onClick={() => setReplyTo(isReplying ? null : {
              id: comment.id, nom: comment.users?.nom
            })}
            className="text-xs text-gray-400 hover:text-primary-600
                       flex items-center gap-1 transition-colors"
          >
            <CornerDownRight size={12} />
            {isReplying ? 'Annuler' : 'Répondre'}
          </button>

          {currentUser?.id === comment.users?.id && (
            <button
              onClick={() => {
                setEditingId(comment.id)
                setEditContent(comment.contenu)
              }}
              className="text-xs text-gray-400 hover:text-primary-600
                         flex items-center gap-1 transition-colors"
            >
              <Edit3 size={12} /> Modifier
            </button>
          )}

          {(currentUser?.id === comment.users?.id ||
            currentUser?.role === 'admin') && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-xs text-gray-400 hover:text-red-500
                         flex items-center gap-1 transition-colors"
            >
              <Trash2 size={12} /> Supprimer
            </button>
          )}

          {hasReplies && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-xs text-primary-500 hover:text-primary-700
                         flex items-center gap-1 transition-colors ml-auto"
            >
              {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {comment.replies.length} réponse{comment.replies.length > 1 ? 's' : ''}
            </button>
          )}
        </div>

        {/* Input réponse */}
        {isReplying && (
          <div className="mt-2 ml-2">
            <CommentInput
              postId={postId}
              parentId={comment.id}
              replyToNom={comment.users?.nom}
              currentUser={currentUser}
              onSubmit={(c) => {
                onNewComment(c)
                setReplyTo(null)
              }}
              placeholder={`Répondre à ${comment.users?.nom}...`}
              autoFocus
            />
          </div>
        )}

        {/* Réponses imbriquées */}
        {hasReplies && showReplies && (
          <div className="mt-2 space-y-2 border-l-2 border-gray-100 pl-3">
            {comment.replies.map(reply => (
              <CommentNode
                key={reply.id}
                comment={reply}
                currentUser={currentUser}
                postId={postId}
                depth={depth + 1}
                replyTo={replyTo}
                setReplyTo={setReplyTo}
                editingId={editingId}
                setEditingId={setEditingId}
                editContent={editContent}
                setEditContent={setEditContent}
                onNewComment={onNewComment}
                onDelete={onDelete}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Input avec mention @  ────────────────────────────────────────────────────
function CommentInput({ postId, parentId, currentUser, onSubmit, placeholder, autoFocus }) {
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionResults, setMentionResults] = useState([])
  const [mentions, setMentions] = useState([]) // [{ id, nom }]
  const inputRef = useRef()

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  // Détecter @mention
  const handleChange = async (e) => {
    const val = e.target.value
    setValue(val)

    const match = val.match(/@(\w+)$/)
    if (match) {
      setMentionQuery(match[1])
      try {
        const { data } = await api.get(`/api/users/mentions?q=${match[1]}`)
        setMentionResults(data)
      } catch {}
    } else {
      setMentionQuery('')
      setMentionResults([])
    }
  }

  const insertMention = (u) => {
  // Utiliser l'ID dans le texte pour le lien, nom affiché pour l'user
    const nomFormatted = u.nom.replace(/\s+/g, '_')
    const newVal = value.replace(/@\w*$/, `@${nomFormatted} `)
    setValue(newVal)
    setMentions(prev => [...prev.filter(m => m.id !== u.id), u])
    setMentionResults([])
    inputRef.current?.focus()
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!value.trim() || submitting) return
    setSubmitting(true)
    try {
      const { data } = await api.post(`/api/posts/${postId}/commentaires`, {
        contenu: value,
        parent_id: parentId || null,
        mentions: mentions.map(m => m.id)
      })
      onSubmit(data)
      setValue('')
      setMentions([])
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative">
      <div className="flex gap-2 items-end">
        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center
                        justify-center overflow-hidden shrink-0">
          {currentUser?.photo_profil
            ? <img src={currentUser.photo_profil} className="w-full h-full object-cover" />
            : <span className="text-primary-700 font-bold text-xs">
                {currentUser?.nom?.charAt(0).toUpperCase()}
              </span>
          }
        </div>
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            value={value}
            onChange={handleChange}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
              if (e.key === 'Escape') setMentionResults([])
            }}
            placeholder={placeholder}
            className="input-field text-sm py-2 pr-10"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !value.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2
                       text-primary-500 hover:text-primary-700
                       disabled:text-gray-300 transition-colors"
          >
            {submitting
              ? <Loader2 size={16} className="animate-spin" />
              : <Send size={16} />
            }
          </button>
        </div>
      </div>

      {/* Dropdown mentions */}
      {mentionResults.length > 0 && (
        <div className="absolute bottom-full mb-1 left-8 bg-white rounded-xl
                        shadow-lg border border-gray-100 overflow-hidden z-30
                        min-w-48 animate-slide-up">
          {mentionResults.map(u => (
            <button
              key={u.id}
              onMouseDown={() => insertMention(u)}
              className="flex items-center gap-2 w-full px-3 py-2
                         hover:bg-primary-50 text-left transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center
                              justify-center overflow-hidden shrink-0">
                {u.photo_profil
                  ? <img src={u.photo_profil} className="w-full h-full object-cover" />
                  : <span className="text-primary-700 font-bold text-xs">
                      {u.nom?.charAt(0).toUpperCase()}
                    </span>
                }
              </div>
              <span className="text-sm font-medium text-gray-800">{u.nom}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Render mentions en bleu ──────────────────────────────────────────────────
function renderMentions(text) {
  if (!text) return null
  // Détecte @Prenom_Nom ou @Prenom
  const parts = text.split(/(@[\w]+(?:_[\w]+)*)/g)
  return parts.map((part, i) => {
    if (!part.startsWith('@')) return part
    const nomBrut = part.slice(1) // enlève le @
    return (
      <Link
        key={i}
        to={`/profile/search/${encodeURIComponent(nomBrut)}`}
        onClick={e => e.stopPropagation()}
        className="text-primary-600 font-medium hover:underline
                   hover:text-primary-800 transition-colors"
      >
        {part}
      </Link>
    )
  })
}
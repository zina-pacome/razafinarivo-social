import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import axios from 'axios'
import {
  MoreHorizontal, Trash2, Edit3, MessageCircle,
  ChevronDown, ChevronUp, Loader2
} from 'lucide-react'
import ReactionBar from './ReactionBar'
import CommentSection from './CommentSection'
import { formatDistanceToNow } from '../utils/dateUtils'

export default function PostCard({ post, onDeleted, onUpdated }) {
  const { user } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.contenu)
  const [loading, setLoading] = useState(false)
  const [commentCount, setCommentCount] = useState(
    post.commentaires?.[0]?.count || post.commentaires?.length || 0
  )

  const isOwner = user?.id === post.users?.id
  const isAdmin = user?.role === 'admin'

  const handleDelete = async () => {
    if (!confirm('Supprimer ce post ?')) return
    try {
      await axios.delete(`/api/posts/${post.id}`)
      onDeleted(post.id)
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpdate = async () => {
    if (!editContent.trim()) return
    setLoading(true)
    try {
      const { data } = await axios.put(`/api/posts/${post.id}`, { contenu: editContent })
      onUpdated({ ...post, ...data })
      setEditing(false)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <Link
          to={`/profile/${post.users?.id}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center
                          justify-center overflow-hidden shrink-0">
            {post.users?.photo_profil
              ? <img src={post.users.photo_profil} className="w-full h-full object-cover" />
              : <span className="text-primary-700 font-bold text-sm">
                  {post.users?.nom?.charAt(0).toUpperCase()}
                </span>
            }
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">{post.users?.nom}</p>
            <p className="text-xs text-gray-400">{formatDistanceToNow(post.created_at)}</p>
          </div>
        </Link>

        {/* Menu options */}
        {(isOwner || isAdmin) && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600
                         hover:bg-gray-100 transition-all"
            >
              <MoreHorizontal size={18} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 bg-white rounded-xl shadow-lg
                              border border-gray-100 py-1 z-10 min-w-[140px]">
                {isOwner && (
                  <button
                    onClick={() => { setEditing(true); setShowMenu(false) }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm
                               text-gray-700 hover:bg-gray-50"
                  >
                    <Edit3 size={15} /> Modifier
                  </button>
                )}
                <button
                  onClick={() => { handleDelete(); setShowMenu(false) }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm
                             text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={15} /> Supprimer
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="px-4 pb-3">
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              rows={3}
              className="input-field resize-none text-sm"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditing(false)}
                className="btn-secondary text-sm px-3 py-1.5"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="btn-primary text-sm px-3 py-1.5 flex items-center gap-1"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : 'Enregistrer'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
            {post.contenu}
          </p>
        )}
      </div>

      {/* Image */}
      {post.image && (
        <div className="px-4 pb-3">
          <img
            src={post.image}
            alt="Post"
            className="w-full rounded-xl object-cover max-h-96"
          />
        </div>
      )}

      {/* Stats */}
      <div className="px-4 py-2 border-t border-gray-50 flex items-center
                      justify-between text-xs text-gray-400">
        <ReactionBar
          postId={post.id}
          initialReactions={post.reactions || []}
          currentUserId={user?.id}
        />
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 hover:text-primary-600
                     transition-colors px-2 py-1 rounded-lg hover:bg-primary-50"
        >
          <MessageCircle size={15} />
          <span>{commentCount} commentaire{commentCount !== 1 ? 's' : ''}</span>
          {showComments
            ? <ChevronUp size={14} />
            : <ChevronDown size={14} />
          }
        </button>
      </div>

      {/* Commentaires */}
      {showComments && (
        <div className="border-t border-gray-50">
          <CommentSection
            postId={post.id}
            onCountChange={setCommentCount}
          />
        </div>
      )}
    </div>
  )
}
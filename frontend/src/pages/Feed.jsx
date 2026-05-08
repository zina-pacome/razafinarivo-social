import { useState, useEffect } from 'react'
import api from '../lib/api' 
import PostCard from '../components/PostCard'
import CreatePost from '../components/CreatePost'
import { Loader2, Newspaper } from 'lucide-react'

export default function Feed() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchPosts = async (p = 1) => {
    try {
      if (p > 1) setLoadingMore(true)
      const { data } = await api.get(`/api/posts?page=${p}`)
      const posts = Array.isArray(data) ? data : []
      if (p === 1) setPosts(posts)
      else setPosts(prev => [...prev, ...posts])
      setHasMore(posts.length === 10)
    } catch (err) {
      console.error('fetchPosts error:', err)
      setPosts([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => { fetchPosts(1) }, [])

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev])
  }

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const handlePostUpdated = (updatedPost) => {
    setPosts(prev => prev.map(p =>
      p.id === updatedPost.id ? { ...p, ...updatedPost } : p
    ))
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchPosts(nextPage)
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="animate-spin text-primary-400" size={32} />
      <p className="text-sm text-gray-400">Chargement du fil d'actualité...</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Créer un post */}
      <div className="animate-fade-in">
        <CreatePost onPostCreated={handlePostCreated} />
      </div>

      {/* Fil vide */}
      {posts.length === 0 ? (
        <div className="card p-14 text-center animate-fade-in">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center
                          justify-center mx-auto mb-4">
            <Newspaper size={24} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium text-sm">
            Aucune publication pour l'instant.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Soyez le premier à partager quelque chose avec la famille !
          </p>
        </div>
      ) : (
        <>
          {/* Liste des posts avec animation décalée */}
          {posts.map((post, i) => (
            <div
              key={post.id}
              className="animate-slide-up"
              style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
            >
              <PostCard
                post={post}
                onDeleted={handlePostDeleted}
                onUpdated={handlePostUpdated}
              />
            </div>
          ))}

          {/* Bouton voir plus */}
          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="btn-secondary w-full py-3 text-sm flex items-center
                         justify-center gap-2"
            >
              {loadingMore
                ? <><Loader2 size={16} className="animate-spin" /> Chargement...</>
                : 'Voir plus de publications'
              }
            </button>
          )}

          {/* Fin du fil */}
          {!hasMore && posts.length > 0 && (
            <div className="text-center py-6">
              <div className="inline-flex items-center gap-2 text-xs text-gray-300">
                <div className="w-12 h-px bg-gray-200" />
                Vous êtes à jour !
                <div className="w-12 h-px bg-gray-200" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
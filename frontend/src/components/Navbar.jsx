import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNonLus } from '../hooks/useNonLus'
import {
  Home, MessageCircle, User, LogOut,
  Shield, Search, X
} from 'lucide-react'
import axios from 'axios'
import NotificationBell from './NotificationBell'
import LogoutModal from './LogoutModal'

export default function Navbar() {
  const { user, token, logout } = useAuth()
  const { count } = useNonLus(user?.id, token)
  const navigate = useNavigate()
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState({ users: [], posts: [] })
  const [showResults, setShowResults] = useState(false)
  const [searching, setSearching] = useState(false)
  const [showLogout, setShowLogout] = useState(false)
  const searchRef = useRef()

  // Fermer dropdown si clic extérieur
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Recherche avec debounce
  useEffect(() => {
    if (!search.trim() || search.length < 2) {
      setResults({ users: [], posts: [] })
      setShowResults(false)
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await axios.get(
          `/api/search?q=${encodeURIComponent(search)}`
        )
        setResults(data)
        setShowResults(true)
      } catch {}
      finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleLogoutConfirm = async () => {
    setShowLogout(false)
    await logout()
    navigate('/login')
  }

  const clearSearch = () => {
    setSearch('')
    setResults({ users: [], posts: [] })
    setShowResults(false)
  }

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const hasResults = results.users?.length > 0 || results.posts?.length > 0

  const navLinks = [
    {
      to: '/',
      icon: <Home size={20} />,
      label: 'Accueil'
    },
    {
      to: '/messages',
      icon: (
        <div className="relative">
          <MessageCircle size={20} />
          {count > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white
                             text-xs w-4 h-4 rounded-full flex items-center
                             justify-center font-bold leading-none">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </div>
      ),
      label: 'Messages'
    },
    {
      to: `/profile/${user?.id}`,
      icon: user?.photo_profil
        ? <img
            src={user.photo_profil}
            className="w-6 h-6 rounded-full object-cover ring-2 ring-gray-200"
            alt={user?.nom}
          />
        : <User size={20} />,
      label: 'Mon profil'
    },
    ...(user?.role === 'admin'
      ? [{ to: '/admin', icon: <Shield size={20} />, label: 'Administration' }]
      : []
    )
  ]

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95
                      backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center
                        justify-between gap-4">

          {/* ── GAUCHE : Logo ───────────────────────────────────────── */}
          <Link to="/" className="flex items-center shrink-0">
            <img
              src="/logo.png"
              alt="Razafinarivo"
              className="h-14 w-auto object-contain"
              onError={e => { e.target.style.display = 'none' }}
            />
          </Link>

          {/* ── CENTRE : Barre de recherche ─────────────────────────── */}
          <div
            ref={searchRef}
            className="flex-1 max-w-lg relative"
          >
            <div className="relative">
              {searching ? (
                <div className="absolute left-3 top-1/2 -translate-y-1/2
                                w-4 h-4 border-2 border-gray-300
                                border-t-primary-500 rounded-full animate-spin" />
              ) : (
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2
                             text-gray-400"
                  size={15}
                />
              )}
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => hasResults && setShowResults(true)}
                placeholder="Rechercher des membres ou des publications..."
                className="input-field pl-9 pr-9 py-2.5 text-sm w-full"
              />
              {search && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Dropdown résultats */}
            {showResults && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-2xl
                              shadow-xl border border-gray-100 overflow-hidden
                              z-50 animate-slide-up">

                {!hasResults ? (
                  <div className="py-8 text-center">
                    <Search size={24} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">
                      Aucun résultat pour{' '}
                      <span className="font-medium text-gray-600">
                        "{search}"
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">

                    {/* Membres */}
                    {results.users?.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-50 border-b
                                        border-gray-100">
                          <p className="text-xs font-semibold text-gray-400
                                        uppercase tracking-wider">
                            Membres ({results.users.length})
                          </p>
                        </div>
                        {results.users.map(u => (
                          <Link
                            key={u.id}
                            to={`/profile/${u.id}`}
                            onClick={clearSearch}
                            className="flex items-center gap-3 px-4 py-3
                                       hover:bg-gray-50 transition-colors"
                          >
                            <div className="relative shrink-0">
                              <div className="w-9 h-9 rounded-full bg-primary-100
                                              flex items-center justify-center
                                              overflow-hidden">
                                {u.photo_profil ? (
                                  <img
                                    src={u.photo_profil}
                                    className="w-full h-full object-cover"
                                    alt={u.nom}
                                  />
                                ) : (
                                  <span className="text-primary-700 font-bold
                                                   text-sm">
                                    {u.nom?.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              {u.en_ligne && (
                                <span className="absolute bottom-0 right-0
                                                 w-2.5 h-2.5 bg-green-500
                                                 rounded-full border-2
                                                 border-white" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900
                                            truncate">
                                {highlightMatch(u.nom, search)}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {u.email}
                              </p>
                            </div>
                            {u.en_ligne && (
                              <span className="text-xs text-green-500
                                               font-medium shrink-0">
                                En ligne
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Publications */}
                    {results.posts?.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-50 border-b
                                        border-gray-100 border-t">
                          <p className="text-xs font-semibold text-gray-400
                                        uppercase tracking-wider">
                            Publications ({results.posts.length})
                          </p>
                        </div>
                        {results.posts.map(post => (
                          <Link
                            key={post.id}
                            to={`/?post=${post.id}`}
                            onClick={clearSearch}
                            className="flex items-start gap-3 px-4 py-3
                                       hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-9 h-9 rounded-full bg-primary-100
                                            flex items-center justify-center
                                            overflow-hidden shrink-0 mt-0.5">
                              {post.users?.photo_profil ? (
                                <img
                                  src={post.users.photo_profil}
                                  className="w-full h-full object-cover"
                                  alt={post.users?.nom}
                                />
                              ) : (
                                <span className="text-primary-700 font-bold
                                                 text-sm">
                                  {post.users?.nom?.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold
                                            text-primary-600 mb-0.5">
                                {post.users?.nom}
                              </p>
                              <p className="text-sm text-gray-700 line-clamp-2
                                            leading-relaxed">
                                {highlightMatch(post.contenu, search)}
                              </p>
                            </div>
                            {post.image && (
                              <img
                                src={post.image}
                                className="w-12 h-12 rounded-lg object-cover
                                           shrink-0"
                                alt="Post"
                              />
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer */}
                {hasResults && (
                  <div className="border-t border-gray-100 px-4 py-2.5
                                  bg-gray-50">
                    <p className="text-xs text-gray-400 text-center">
                      {(results.users?.length || 0) +
                       (results.posts?.length || 0)} résultat(s) pour{' '}
                      <span className="font-medium text-gray-600">
                        "{search}"
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── DROITE : Nav + Cloche + Déconnexion ─────────────────── */}
          <div className="flex items-center gap-0.5">

            {/* Liens nav */}
            {navLinks.map(({ to, icon, label }) => (
              <Link
                key={to}
                to={to}
                title={label}
                className={`relative p-2.5 rounded-xl transition-all duration-200
                            ${isActive(to)
                              ? 'text-primary-600 bg-primary-50'
                              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                            }`}
              >
                {icon}
                {isActive(to) && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2
                                   w-1 h-1 bg-primary-600 rounded-full" />
                )}
              </Link>
            ))}

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Cloche notifications */}
            <NotificationBell />

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Déconnexion */}
            <button
              onClick={() => setShowLogout(true)}
              title="Déconnexion"
              className="p-2.5 rounded-xl text-gray-400 hover:text-red-500
                         hover:bg-red-50 transition-all duration-200"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Modal déconnexion */}
      {showLogout && (
        <LogoutModal
          onConfirm={handleLogoutConfirm}
          onCancel={() => setShowLogout(false)}
        />
      )}
    </>
  )
}

// ── Highlight mots recherchés ─────────────────────────────────────────────────
function highlightMatch(text, query) {
  if (!text || !query) return text
  const parts = text.split(new RegExp(`(${query})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark
          key={i}
          className="bg-yellow-100 text-yellow-800 rounded
                     px-0.5 font-medium not-italic"
        >
          {part}
        </mark>
      : part
  )
}
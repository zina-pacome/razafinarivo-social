import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../hooks/useNotifications'
import {
  Bell, Heart, MessageCircle,
  AtSign, Image, UserPlus, Loader2, X
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from '../utils/dateUtils'

const TYPE_CONFIG = {
  reaction_post: {
    icon: <Heart size={13} className="text-red-500" />,
    label: 'a réagi à votre publication',
    bg: 'bg-red-50'
  },
  reaction_comment: {
    icon: <Heart size={13} className="text-red-500" />,
    label: 'a réagi à votre commentaire',
    bg: 'bg-red-50'
  },
  commentaire: {
    icon: <MessageCircle size={13} className="text-blue-500" />,
    label: 'a commenté votre publication',
    bg: 'bg-blue-50'
  },
  reponse: {
    icon: <MessageCircle size={13} className="text-green-500" />,
    label: 'a répondu à votre commentaire',
    bg: 'bg-green-50'
  },
  mention: {
    icon: <AtSign size={13} className="text-purple-500" />,
    label: 'vous a mentionné',
    bg: 'bg-purple-50'
  },
  photo_profil: {
    icon: <Image size={13} className="text-orange-500" />,
    label: 'a mis à jour sa photo de profil',
    bg: 'bg-orange-50'
  },
  photo_couverture: {
    icon: <Image size={13} className="text-orange-500" />,
    label: 'a mis à jour sa photo de couverture',
    bg: 'bg-orange-50'
  },
  nouveau_membre: {
    icon: <UserPlus size={13} className="text-teal-500" />,
    label: 'a rejoint la famille',
    bg: 'bg-teal-50'
  },
}

export default function NotificationBell() {
  const { user, token } = useAuth()
  const { count, notifications, fetchAll, markAllRead } = useNotifications(user?.id, token)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef()
  const navigate = useNavigate()

  // Fermer si clic extérieur
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = async () => {
    if (open) {
      setOpen(false)
      return
    }
    setOpen(true)
    setLoading(true)
    await fetchAll()
    setLoading(false)
    if (count > 0) markAllRead()
  }

  const handleClick = (notif) => {
    setOpen(false)
    if (notif.post_id) {
      navigate(`/?post=${notif.post_id}`)
    } else if (notif.from_user?.id) {
      navigate(`/profile/${notif.from_user.id}`)
    }
  }

  return (
    <div ref={ref} className="relative">

      {/* Bouton cloche */}
      <button
        onClick={handleOpen}
        className={`relative p-2.5 rounded-xl transition-all duration-200
                    ${open
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                    }`}
        title="Notifications"
      >
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white
                           text-xs w-4 h-4 rounded-full flex items-center
                           justify-center font-bold leading-none animate-pulse">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Panel notifications */}
      {open && (
        <div className="absolute right-0 top-14 w-80 bg-white rounded-2xl
                        shadow-xl border border-gray-100 z-50 animate-slide-up
                        overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3
                          border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-gray-500" />
              <h3 className="font-semibold text-gray-900 text-sm">
                Notifications
              </h3>
              {count > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold
                                 px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {notifications.some(n => !n.lu) && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-primary-600 hover:text-primary-800
                             font-medium transition-colors"
                >
                  Tout lire
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg
                           hover:bg-gray-100 transition-all"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Liste */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 size={22} className="animate-spin text-gray-300" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-medium">
                  Aucune notification
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  Vous êtes à jour !
                </p>
              </div>
            ) : (
              notifications.map(notif => {
                const config = TYPE_CONFIG[notif.type] || {
                  icon: <Bell size={13} className="text-gray-400" />,
                  label: 'nouvelle notification',
                  bg: 'bg-gray-50'
                }

                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={`w-full flex items-start gap-3 px-4 py-3
                                hover:bg-gray-50 transition-colors text-left
                                ${!notif.lu ? 'bg-primary-50/30' : 'bg-white'}`}
                  >
                    {/* Avatar + icône réaction */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary-100
                                      flex items-center justify-center
                                      overflow-hidden">
                        {notif.from_user?.photo_profil ? (
                          <img
                            src={notif.from_user.photo_profil}
                            className="w-full h-full object-cover"
                            alt={notif.from_user?.nom}
                          />
                        ) : (
                          <span className="text-primary-700 font-bold text-sm">
                            {notif.from_user?.nom?.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {/* Icône type */}
                      <span className={`absolute -bottom-0.5 -right-0.5
                                        w-5 h-5 rounded-full flex items-center
                                        justify-center border-2 border-white
                                        ${config.bg}`}>
                        {config.icon}
                      </span>
                    </div>

                    {/* Texte */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {/* Nom cliquable */}
                        <Link
                          to={`/profile/${notif.from_user?.id}`}
                          onClick={e => e.stopPropagation()}
                          className="font-semibold text-gray-900
                                     hover:text-primary-600 hover:underline
                                     transition-colors"
                        >
                          {notif.from_user?.nom}
                        </Link>
                        {' '}
                        <span className="text-gray-500">{config.label}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDistanceToNow(notif.created_at)}
                      </p>
                    </div>

                    {/* Point non lu */}
                    {!notif.lu && (
                      <div className="w-2 h-2 bg-primary-500 rounded-full
                                      shrink-0 mt-2" />
                    )}
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5 bg-gray-50">
              <p className="text-xs text-gray-400 text-center">
                Les {notifications.length} dernières notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
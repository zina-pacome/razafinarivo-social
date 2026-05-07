import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Home, MessageCircle, User, Shield } from 'lucide-react'
import { useNonLus } from '../hooks/useNonLus'

export default function Sidebar() {
  const { user, token } = useAuth()
  const location = useLocation()
  const { count } = useNonLus(user?.id, token)

  const links = [
    {
      to: '/',
      icon: <Home size={18} />,
      label: 'Fil d\'actualité'
    },
    {
      to: '/messages',
      icon: <MessageCircle size={18} />,
      label: 'Messages',
      badge: count
    },
    {
      to: `/profile/${user?.id}`,
      icon: <User size={18} />,
      label: 'Mon profil'
    },
    ...(user?.role === 'admin'
      ? [{ to: '/admin', icon: <Shield size={18} />, label: 'Administration' }]
      : [])
  ]

  return (
    <aside className="hidden lg:block w-56 shrink-0">
      <div className="card p-3 sticky top-28 animate-fade-in">

        {/* User card */}
        <Link
          to={`/profile/${user?.id}`}
          className="flex items-center gap-3 p-3 mb-3 rounded-xl
                     hover:bg-gray-50 transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center
                          justify-center overflow-hidden shrink-0 ring-2
                          ring-primary-100 group-hover:ring-primary-200 transition-all">
            {user?.photo_profil
              ? <img src={user.photo_profil} className="w-full h-full object-cover" />
              : <span className="text-primary-700 font-bold text-sm">
                  {user?.nom?.charAt(0).toUpperCase()}
                </span>
            }
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-gray-900 truncate leading-tight">
              {user?.nom}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </Link>

        <div className="h-px bg-gray-100 mb-2" />

        {/* Nav links */}
        <nav className="flex flex-col gap-0.5">
          {links.map(({ to, icon, label, badge }) => {
            const active = location.pathname === to ||
              (to !== '/' && location.pathname.startsWith(to))
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
                            text-sm font-medium transition-all duration-200
                            ${active
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            }`}
              >
                <span className={`shrink-0 transition-colors
                                  ${active ? 'text-primary-600' : 'text-gray-400'}`}>
                  {icon}
                </span>
                <span className="flex-1">{label}</span>
                {badge > 0 && (
                  <span className="bg-primary-600 text-white text-xs font-bold
                                   w-5 h-5 rounded-full flex items-center
                                   justify-center shrink-0">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer famille */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-center text-gray-300 font-medium tracking-wide">
            Famille Razafinarivo
          </p>
        </div>
      </div>
    </aside>
  )
}
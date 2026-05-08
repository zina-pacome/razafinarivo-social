import { useState, useEffect } from 'react'
import api from '../../lib/api'
import { Search, Loader2, X } from 'lucide-react'

export default function NewConversation({ onSelect, onCancel }) {
  const [users, setUsers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(users)
    } else {
      setFiltered(users.filter(u =>
        u.nom.toLowerCase().includes(search.toLowerCase())
      ))
    }
  }, [search, users])

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/api/messages/users')
      const users = Array.isArray(data) ? data : []
      setUsers(users)
      setFiltered(users)
    } catch (err) {
      console.error(err)
      setUsers([])
      setFiltered([])
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center
                      justify-between gap-3">
        <h3 className="font-semibold text-gray-900">Nouvelle conversation</h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-lg
                     hover:bg-gray-100 transition-all"
        >
          <X size={18} />
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2
                             text-gray-400" size={16} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un membre..."
            className="input-field pl-9 py-2 text-sm"
            autoFocus
          />
        </div>
      </div>

      {/* Liste users */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 size={24} className="animate-spin text-gray-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">
            Aucun membre trouvé
          </div>
        ) : (
          filtered.map(u => (
            <button
              key={u.id}
              onClick={() => onSelect(u)}
              className="w-full flex items-center gap-3 px-4 py-3
                         hover:bg-gray-50 transition-all text-left"
            >
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary-100
                                flex items-center justify-center overflow-hidden">
                  {u.photo_profil
                    ? <img src={u.photo_profil} className="w-full h-full object-cover" />
                    : <span className="text-primary-700 font-bold text-sm">
                        {u.nom?.charAt(0).toUpperCase()}
                      </span>
                  }
                </div>
                {u.en_ligne && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5
                                   bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{u.nom}</p>
                <p className="text-xs text-gray-400">
                  {u.en_ligne
                    ? <span className="text-green-500">En ligne</span>
                    : 'Hors ligne'
                  }
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
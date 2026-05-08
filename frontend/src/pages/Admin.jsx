import { useState, useEffect } from 'react'
import api from '../lib/api' 
import {
  Users, CheckCircle, XCircle, Trash2,
  Shield, Clock, UserCheck, UserX, Loader2,
  AlertTriangle
} from 'lucide-react'

const TABS = [
  { id: 'en_attente', label: 'En attente', icon: Clock },
  { id: 'accepte',   label: 'Acceptés',   icon: UserCheck },
  { id: 'refuse',    label: 'Refusés',    icon: UserX },
]

export default function Admin() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('en_attente')
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/api/admin/users')
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleStatut = async (userId, statut) => {
    setActionLoading(userId + statut)
    try {
      await api.patch(`/api/admin/users/${userId}/statut`, { statut })
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, statut } : u
      ))
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (userId) => {
    if (!confirm('Supprimer définitivement cet utilisateur ?')) return
    setActionLoading(userId + 'delete')
    try {
      await api.delete(`/api/admin/users/${userId}`)
      setUsers(prev => prev.filter(u => u.id !== userId))
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = users.filter(u => u.statut === tab)
  const counts = {
    en_attente: users.filter(u => u.statut === 'en_attente').length,
    accepte:    users.filter(u => u.statut === 'accepte').length,
    refuse:     users.filter(u => u.statut === 'refuse').length,
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center
                          justify-center">
            <Shield className="text-primary-600" size={20} />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg">Dashboard Admin</h1>
            <p className="text-sm text-gray-400">
              Gestion des membres de la famille Razafinarivo
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            icon={<Clock size={18} className="text-orange-500" />}
            label="En attente"
            value={counts.en_attente}
            color="orange"
          />
          <StatCard
            icon={<UserCheck size={18} className="text-green-500" />}
            label="Acceptés"
            value={counts.accepte}
            color="green"
          />
          <StatCard
            icon={<UserX size={18} className="text-red-500" />}
            label="Refusés"
            value={counts.refuse}
            color="red"
          />
        </div>
      </div>

      {/* Alerte si en attente */}
      {counts.en_attente > 0 && (
        <div className="flex items-center gap-3 bg-orange-50 border border-orange-200
                        rounded-2xl px-4 py-3">
          <AlertTriangle size={18} className="text-orange-500 shrink-0" />
          <p className="text-sm text-orange-700">
            <span className="font-semibold">{counts.en_attente} demande{counts.en_attente > 1 ? 's' : ''}</span>
            {' '}en attente de validation.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium
                          border-b-2 transition-all
                          ${tab === id
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
            >
              <Icon size={15} />
              {label}
              {counts[id] > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full
                                  ${tab === id
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'bg-gray-100 text-gray-500'
                                  }`}>
                  {counts[id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 size={28} className="animate-spin text-gray-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Aucun utilisateur dans cette catégorie</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(u => (
              <div key={u.id}
                   className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50
                              transition-all">

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center
                                justify-center overflow-hidden shrink-0">
                  {u.photo_profil
                    ? <img src={u.photo_profil} className="w-full h-full object-cover" />
                    : <span className="text-primary-700 font-bold text-sm">
                        {u.nom?.charAt(0).toUpperCase()}
                      </span>
                  }
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {u.nom}
                    </p>
                    {u.role === 'admin' && (
                      <span className="bg-primary-100 text-primary-700 text-xs
                                       px-1.5 py-0.5 rounded-full font-medium shrink-0">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Inscrit le {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                {/* Actions */}
                {u.role !== 'admin' && (
                  <div className="flex items-center gap-2 shrink-0">
                    {tab === 'en_attente' && (
                      <>
                        <ActionBtn
                          onClick={() => handleStatut(u.id, 'accepte')}
                          loading={actionLoading === u.id + 'accepte'}
                          color="green"
                          icon={<CheckCircle size={15} />}
                          label="Accepter"
                        />
                        <ActionBtn
                          onClick={() => handleStatut(u.id, 'refuse')}
                          loading={actionLoading === u.id + 'refuse'}
                          color="red"
                          icon={<XCircle size={15} />}
                          label="Refuser"
                        />
                      </>
                    )}
                    {tab === 'refuse' && (
                      <ActionBtn
                        onClick={() => handleStatut(u.id, 'accepte')}
                        loading={actionLoading === u.id + 'accepte'}
                        color="green"
                        icon={<CheckCircle size={15} />}
                        label="Accepter"
                      />
                    )}
                    {tab === 'accepte' && (
                      <ActionBtn
                        onClick={() => handleStatut(u.id, 'refuse')}
                        loading={actionLoading === u.id + 'refuse'}
                        color="red"
                        icon={<XCircle size={15} />}
                        label="Suspendre"
                      />
                    )}
                    <ActionBtn
                      onClick={() => handleDelete(u.id)}
                      loading={actionLoading === u.id + 'delete'}
                      color="gray"
                      icon={<Trash2 size={15} />}
                      label="Supprimer"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const StatCard = ({ icon, label, value, color }) => {
  const colors = {
    orange: 'bg-orange-50 border-orange-100',
    green:  'bg-green-50 border-green-100',
    red:    'bg-red-50 border-red-100',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

const ActionBtn = ({ onClick, loading, color, icon, label }) => {
  const colors = {
    green: 'text-green-600 hover:bg-green-50 border-green-200',
    red:   'text-red-500 hover:bg-red-50 border-red-200',
    gray:  'text-gray-400 hover:bg-gray-50 border-gray-200',
  }
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border
                  text-xs font-medium transition-all disabled:opacity-50
                  ${colors[color]}`}
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : icon}
      {label}
    </button>
  )
}
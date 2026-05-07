import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api' 
import {
  Camera, Edit3, Save, X, Calendar,
  MessageCircle, Loader2, Settings,
  User, Mail, Lock, Eye, EyeOff,
  CheckCircle, ImageIcon
} from 'lucide-react'
import PostCard from '../components/PostCard'
import { formatDistanceToNow } from '../utils/dateUtils'

const TABS = [
  { id: 'posts',    label: 'Publications', icon: ImageIcon },
  { id: 'settings', label: 'Paramètres',  icon: Settings },
]

export default function Profile() {
  const { id } = useParams()
  const { user, token } = useAuth()
  const [profile, setProfile]       = useState(null)
  const [posts, setPosts]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState('posts')
  const [editing, setEditing]       = useState(false)
  const [editForm, setEditForm]     = useState({ nom: '', bio: '' })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [saving, setSaving]         = useState(false)
  const [savingCover, setSavingCover] = useState(false)

  const isOwn = user?.id === id

  useEffect(() => {
    setActiveTab('posts')
    fetchProfile()
    fetchUserPosts()
  }, [id])

  const fetchProfile = async () => {
    try {
      const { data } = await api.get(`/api/users/${id}`)
      setProfile(data)
      setEditForm({ nom: data.nom, bio: data.bio || '' })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserPosts = async () => {
    try {
      const { data } = await api.get(`/api/users/${id}/posts`)
      setPosts(data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleCoverChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setSavingCover(true)
    try {
      const formData = new FormData()
      formData.append('cover', file)
      const { data } = await api.put('/api/users/cover', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setProfile(prev => ({ ...prev, photo_couverture: data.photo_couverture }))
      fetchUserPosts()
    } catch (err) {
      console.error(err)
    } finally {
      setSavingCover(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('nom', editForm.nom)
      formData.append('bio', editForm.bio)
      if (avatarFile) formData.append('avatar', avatarFile)

      const { data } = await api.put('/api/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setProfile(prev => ({ ...prev, ...data }))
      setEditing(false)
      setAvatarFile(null)
      setAvatarPreview(null)
      if (avatarFile) fetchUserPosts()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setAvatarFile(null)
    setAvatarPreview(null)
    setEditForm({ nom: profile.nom, bio: profile.bio || '' })
  }

  const handlePostDeleted  = (postId) =>
    setPosts(prev => prev.filter(p => p.id !== postId))

  const handlePostUpdated  = (updatedPost) =>
    setPosts(prev => prev.map(p =>
      p.id === updatedPost.id ? { ...p, ...updatedPost } : p
    ))

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="animate-spin text-primary-500" size={32} />
    </div>
  )

  if (!profile) return (
    <div className="card p-12 text-center text-gray-400">
      Profil introuvable
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">

      {/* ── Carte profil ─────────────────────────────────────────────────── */}
      <div className="card overflow-hidden">

        {/* Bannière */}
        <div className="h-44 relative group">
          {profile.photo_couverture ? (
            <img
              src={profile.photo_couverture}
              alt="Couverture"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r
                            from-primary-500 to-primary-700" />
          )}

          {isOwn && (
            <label className={`absolute bottom-3 right-3 text-white text-xs
                               px-3 py-1.5 rounded-lg cursor-pointer
                               flex items-center gap-1.5 transition-all
                               ${savingCover
                                 ? 'bg-black/60 cursor-wait'
                                 : 'bg-black/40 hover:bg-black/60 opacity-0 group-hover:opacity-100'
                               }`}>
              {savingCover
                ? <><Loader2 size={13} className="animate-spin" /> Envoi...</>
                : <><Camera size={13} /> Changer la couverture</>
              }
              <input
                type="file" accept="image/*" className="hidden"
                onChange={handleCoverChange} disabled={savingCover}
              />
            </label>
          )}
        </div>

        {/* Contenu */}
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4">

            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-white
                              bg-primary-100 flex items-center justify-center
                              overflow-hidden shadow-md">
                {avatarPreview || profile.photo_profil ? (
                  <img
                    src={avatarPreview || profile.photo_profil}
                    alt={profile.nom}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-primary-700 font-bold text-3xl">
                    {profile.nom?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {isOwn && editing && (
                <label className="absolute bottom-0 right-0 bg-primary-600
                                  hover:bg-primary-700 text-white rounded-full
                                  p-2 cursor-pointer transition-all shadow-md">
                  <Camera size={14} />
                  <input
                    type="file" accept="image/*" className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              )}
            </div>

            {/* Boutons */}
            <div className="flex gap-2 mt-14">
              {isOwn ? (
                editing ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className="btn-secondary flex items-center gap-1.5 text-sm"
                    >
                      <X size={15} /> Annuler
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="btn-primary flex items-center gap-1.5 text-sm"
                    >
                      {saving
                        ? <Loader2 size={15} className="animate-spin" />
                        : <><Save size={15} /> Enregistrer</>
                      }
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="btn-secondary flex items-center gap-1.5 text-sm"
                  >
                    <Edit3 size={15} /> Modifier le profil
                  </button>
                )
              ) : (
                <Link
                  to={`/messages/${profile.id}`}
                  className="btn-primary flex items-center gap-1.5 text-sm"
                >
                  <MessageCircle size={15} /> Envoyer un message
                </Link>
              )}
            </div>
          </div>

          {/* Infos */}
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Nom complet
                </label>
                <input
                  value={editForm.nom}
                  onChange={e => setEditForm({ ...editForm, nom: e.target.value })}
                  className="input-field"
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Bio
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Parlez-vous en quelques mots..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{profile.nom}</h1>
                {profile.role === 'admin' && (
                  <span className="badge bg-primary-100 text-primary-700">
                    Admin
                  </span>
                )}
                {profile.en_ligne && (
                  <span className="flex items-center gap-1 text-xs
                                   text-green-500 font-medium">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full
                                     animate-pulse" />
                    En ligne
                  </span>
                )}
              </div>
              {profile.bio && (
                <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                  {profile.bio}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  Membre depuis {formatDistanceToNow(profile.created_at)}
                </span>
                <span className="flex items-center gap-1.5">
                  <ImageIcon size={13} />
                  {posts.length} publication{posts.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Onglets — seulement sur son propre profil */}
        {isOwn && (
          <div className="flex border-t border-gray-100">
            {TABS.map(({ id: tabId, label, icon: Icon }) => (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={`flex-1 flex items-center justify-center gap-2
                            py-3 text-sm font-medium transition-all border-b-2
                            ${activeTab === tabId
                              ? 'border-primary-600 text-primary-600'
                              : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Contenu selon onglet ─────────────────────────────────────────── */}
      {isOwn && activeTab === 'settings' ? (
        <SettingsPanel
          profile={profile}
          onUpdated={(updated) => setProfile(prev => ({ ...prev, ...updated }))}
        />
      ) : (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-600 text-xs px-1 uppercase
                         tracking-widest">
            Publications
          </h2>
          {posts.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center
                              justify-center mx-auto mb-3">
                <ImageIcon size={20} className="text-gray-300" />
              </div>
              <p className="text-gray-400 text-sm">
                {isOwn
                  ? 'Vous n\'avez pas encore publié.'
                  : `${profile.nom} n'a pas encore publié.`
                }
              </p>
            </div>
          ) : (
            posts.map((post, i) => (
              <div
                key={post.id}
                className="animate-slide-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <PostCard
                  post={post}
                  onDeleted={handlePostDeleted}
                  onUpdated={handlePostUpdated}
                />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── Panneau Paramètres ────────────────────────────────────────────────────────
function SettingsPanel({ profile, onUpdated }) {
  const [form, setForm] = useState({
    nom:        profile.nom || '',
    email:      profile.email || '',
    ancien_mdp: '',
    nouveau_mdp: '',
    confirm_mdp: ''
  })
  const [showOld, setShowOld]   = useState(false)
  const [showNew, setShowNew]   = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState('')
  const [error, setError]       = useState('')

  const handleSubmit = async (section) => {
    setError('')
    setSuccess('')

    // Validation côté client
    if (section === 'password') {
      if (!form.ancien_mdp) {
        return setError('Veuillez entrer votre ancien mot de passe')
      }
      if (form.nouveau_mdp.length < 6) {
        return setError('Le nouveau mot de passe doit contenir au moins 6 caractères')
      }
      if (form.nouveau_mdp !== form.confirm_mdp) {
        return setError('Les mots de passe ne correspondent pas')
      }
    }

    setLoading(true)
    try {
      const payload = {}

      if (section === 'identity') {
        payload.nom   = form.nom
        payload.email = form.email
      }

      if (section === 'password') {
        payload.ancien_mdp  = form.ancien_mdp
        payload.nouveau_mdp = form.nouveau_mdp
      }

      const { data } = await api.put('/api/users/settings', payload)
      onUpdated(data.user)
      setSuccess(data.message)

      // Reset champs mot de passe
      if (section === 'password') {
        setForm(prev => ({
          ...prev,
          ancien_mdp: '',
          nouveau_mdp: '',
          confirm_mdp: ''
        }))
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">

      {/* Messages globaux */}
      {success && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200
                        text-green-700 px-4 py-3 rounded-2xl text-sm animate-fade-in">
          <CheckCircle size={18} className="shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700
                        px-4 py-3 rounded-2xl text-sm animate-fade-in">
          {error}
        </div>
      )}

      {/* ── Section Identité ──────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center
                          justify-center">
            <User size={17} className="text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">
              Informations personnelles
            </h3>
            <p className="text-xs text-gray-400">
              Modifier votre nom et adresse email
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Nom */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Nom complet
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2
                               text-gray-400" size={16} />
              <input
                type="text"
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
                className="input-field pl-10"
                placeholder="Votre nom complet"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Adresse email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2
                               text-gray-400" size={16} />
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="input-field pl-10"
                placeholder="votre@email.com"
              />
            </div>
          </div>

          <button
            onClick={() => handleSubmit('identity')}
            disabled={loading}
            className="btn-primary flex items-center gap-2 text-sm px-5"
          >
            {loading
              ? <Loader2 size={15} className="animate-spin" />
              : <><Save size={15} /> Enregistrer les modifications</>
            }
          </button>
        </div>
      </div>

      {/* ── Section Mot de passe ──────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center
                          justify-center">
            <Lock size={17} className="text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">
              Mot de passe
            </h3>
            <p className="text-xs text-gray-400">
              Choisir un nouveau mot de passe sécurisé
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Ancien mot de passe */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Mot de passe actuel
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2
                               text-gray-400" size={16} />
              <input
                type={showOld ? 'text' : 'password'}
                value={form.ancien_mdp}
                onChange={e => setForm({ ...form, ancien_mdp: e.target.value })}
                className="input-field pl-10 pr-10"
                placeholder="Votre mot de passe actuel"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2
                           text-gray-400 hover:text-gray-600"
              >
                {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Nouveau mot de passe */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2
                               text-gray-400" size={16} />
              <input
                type={showNew ? 'text' : 'password'}
                value={form.nouveau_mdp}
                onChange={e => setForm({ ...form, nouveau_mdp: e.target.value })}
                className="input-field pl-10 pr-10"
                placeholder="Minimum 6 caractères"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2
                           text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Indicateur force mot de passe */}
            {form.nouveau_mdp && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all
                                  ${getPasswordStrength(form.nouveau_mdp) > i
                                    ? getStrengthColor(getPasswordStrength(form.nouveau_mdp))
                                    : 'bg-gray-100'
                                  }`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-medium
                               ${getStrengthTextColor(getPasswordStrength(form.nouveau_mdp))}`}>
                  {getStrengthLabel(getPasswordStrength(form.nouveau_mdp))}
                </p>
              </div>
            )}
          </div>

          {/* Confirmation */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Confirmer le nouveau mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2
                               text-gray-400" size={16} />
              <input
                type={showConf ? 'text' : 'password'}
                value={form.confirm_mdp}
                onChange={e => setForm({ ...form, confirm_mdp: e.target.value })}
                className={`input-field pl-10 pr-10
                            ${form.confirm_mdp && form.confirm_mdp !== form.nouveau_mdp
                              ? 'border-red-300 focus:ring-red-300'
                              : form.confirm_mdp && form.confirm_mdp === form.nouveau_mdp
                                ? 'border-green-300 focus:ring-green-300'
                                : ''
                            }`}
                placeholder="Répéter le nouveau mot de passe"
              />
              <button
                type="button"
                onClick={() => setShowConf(!showConf)}
                className="absolute right-3 top-1/2 -translate-y-1/2
                           text-gray-400 hover:text-gray-600"
              >
                {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Message correspondance */}
            {form.confirm_mdp && (
              <p className={`text-xs mt-1 font-medium
                             ${form.confirm_mdp === form.nouveau_mdp
                               ? 'text-green-500'
                               : 'text-red-500'
                             }`}>
                {form.confirm_mdp === form.nouveau_mdp
                  ? '✓ Les mots de passe correspondent'
                  : '✗ Les mots de passe ne correspondent pas'
                }
              </p>
            )}
          </div>

          <button
            onClick={() => handleSubmit('password')}
            disabled={loading || !form.ancien_mdp || !form.nouveau_mdp ||
                      form.nouveau_mdp !== form.confirm_mdp}
            className="btn-primary flex items-center gap-2 text-sm px-5
                       bg-orange-500 hover:bg-orange-600"
          >
            {loading
              ? <Loader2 size={15} className="animate-spin" />
              : <><Lock size={15} /> Changer le mot de passe</>
            }
          </button>
        </div>
      </div>

      {/* ── Danger zone ───────────────────────────────────────────────── */}
      <div className="card p-6 border-red-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center
                          justify-center">
            <X size={17} className="text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">
              Zone dangereuse
            </h3>
            <p className="text-xs text-gray-400">
              Actions irréversibles
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          La suppression de votre compte est définitive.
          Toutes vos publications et messages seront supprimés.
        </p>
        <button
          onClick={() => {
            if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
              api.delete('/api/users/account').then(() => {
                window.location.href = '/login'
              })
            }
          }}
          className="text-sm text-red-500 hover:text-red-700 font-medium
                     flex items-center gap-1.5 border border-red-200
                     hover:border-red-400 px-4 py-2 rounded-xl transition-all"
        >
          <X size={15} /> Supprimer mon compte
        </button>
      </div>
    </div>
  )
}

// ── Helpers force mot de passe ────────────────────────────────────────────────
const getPasswordStrength = (pwd) => {
  let score = 0
  if (pwd.length >= 6)  score++
  if (pwd.length >= 10) score++
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score++
  return score
}

const getStrengthColor = (s) => {
  if (s <= 1) return 'bg-red-400'
  if (s === 2) return 'bg-orange-400'
  if (s === 3) return 'bg-yellow-400'
  return 'bg-green-500'
}

const getStrengthTextColor = (s) => {
  if (s <= 1) return 'text-red-500'
  if (s === 2) return 'text-orange-500'
  if (s === 3) return 'text-yellow-600'
  return 'text-green-600'
}

const getStrengthLabel = (s) => {
  if (s <= 1) return 'Très faible'
  if (s === 2) return 'Faible'
  if (s === 3) return 'Moyen'
  return 'Fort'
}
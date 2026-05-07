import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, Mail, Lock, UserPlus, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nom: '', email: '', mot_de_passe: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.mot_de_passe.length < 6) {
      return setError('Le mot de passe doit contenir au moins 6 caractères')
    }
    setLoading(true)
    try {
      await register(form.nom, form.email, form.mot_de_passe)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50
                      flex items-center justify-center p-4">
        <div className="card p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center
                          justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Demande envoyée !</h2>
          <p className="text-gray-500 text-sm mb-6">
            Votre demande d'accès a été transmise à l'administrateur.
            Vous serez notifié dès que votre compte sera validé.
          </p>
          <Link to="/login" className="btn-primary inline-flex items-center gap-2">
            Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50
                    flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Razafinarivo"
            className="h-48 w-auto mx-auto mb-4 object-contain"
            onError={e => e.target.style.display = 'none'}
          />
          <h1 className="text-2xl font-bold text-gray-900">Rejoindre la famille</h1>
          <p className="text-gray-500 mt-1">Votre accès sera validé par un administrateur</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700
                              text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nom complet
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2
                                 text-gray-400" size={18} />
                <input
                  type="text"
                  className="input-field pl-10"
                  placeholder="Jean Razafinarivo"
                  value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2
                                 text-gray-400" size={18} />
                <input
                  type="email"
                  className="input-field pl-10"
                  placeholder="votre@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2
                                 text-gray-400" size={18} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="input-field pl-10 pr-10"
                  placeholder="Minimum 6 caractères"
                  value={form.mot_de_passe}
                  onChange={e => setForm({ ...form, mot_de_passe: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                             hover:text-gray-600"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white
                                  rounded-full animate-spin" />
                : <><UserPlus size={18} /> Envoyer la demande</>
              }
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà membre ?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
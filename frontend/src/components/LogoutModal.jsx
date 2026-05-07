import { LogOut, X } from 'lucide-react'

export default function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50
                 flex items-center justify-center p-4 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm
                   overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4
                        border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center
                            justify-center">
              <LogOut size={17} className="text-red-500" />
            </div>
            <h3 className="font-semibold text-gray-900">Déconnexion</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg
                       hover:bg-gray-100 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img
              src="/logo.png"
              alt="Razafinarivo"
              className="h-20 w-auto object-contain"
              onError={e => e.target.style.display = 'none'}
            />
          </div>
          <p className="text-center text-gray-600 text-sm leading-relaxed">
            Êtes-vous sûr de vouloir vous déconnecter de
            <span className="font-semibold text-gray-900">
              {' '}Razafinarivo
            </span> ?
          </p>
          <p className="text-center text-gray-400 text-xs mt-1">
            Vous devrez vous reconnecter pour accéder à votre compte.
          </p>
        </div>

        {/* Boutons */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            className="btn-secondary flex-1 py-2.5 text-sm"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 text-sm font-medium rounded-xl
                       bg-red-500 hover:bg-red-600 active:bg-red-700
                       text-white transition-all duration-200 active:scale-95
                       flex items-center justify-center gap-2 shadow-sm"
          >
            <LogOut size={15} />
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  )
}
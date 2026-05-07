import { Loader2 } from 'lucide-react'

export default function ConversationList({
  conversations, selectedId, currentUserId, onSelect, loading
}) {
  if (loading) return (
    <div className="flex justify-center p-8">
      <Loader2 size={24} className="animate-spin text-gray-300" />
    </div>
  )

  if (conversations.length === 0) return (
    <div className="p-6 text-center text-gray-400 text-sm">
      Aucune conversation.<br />Commencez à écrire !
    </div>
  )

  return (
    <div className="py-1">
      {conversations.map(({ interlocuteur, dernierMessage, nonLus }) => (
        <button
          key={interlocuteur.id}
          onClick={() => onSelect(interlocuteur)}
          className={`w-full flex items-center gap-3 px-4 py-3 text-left
                      transition-all hover:bg-gray-50
                      ${selectedId === interlocuteur.id ? 'bg-primary-50' : ''}`}
        >
          {/* Avatar avec indicateur en ligne */}
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center
                            justify-center overflow-hidden">
              {interlocuteur.photo_profil
                ? <img src={interlocuteur.photo_profil}
                       className="w-full h-full object-cover" />
                : <span className="text-primary-700 font-bold text-sm">
                    {interlocuteur.nom?.charAt(0).toUpperCase()}
                  </span>
              }
            </div>
            {interlocuteur.en_ligne && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500
                               rounded-full border-2 border-white" />
            )}
          </div>

          {/* Infos */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className={`text-sm truncate
                            ${nonLus > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                {interlocuteur.nom}
              </p>
              {dernierMessage && (
                <span className="text-xs text-gray-400 shrink-0 ml-1">
                  {formatTime(dernierMessage.created_at)}
                </span>
              )}
            </div>
            {dernierMessage && (
              <p className={`text-xs truncate mt-0.5
                            ${nonLus > 0 ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
                {dernierMessage.sender_id === currentUserId ? 'Vous : ' : ''}
                {dernierMessage.contenu}
              </p>
            )}
          </div>

          {/* Badge non lus */}
          {nonLus > 0 && (
            <span className="bg-primary-600 text-white text-xs font-bold
                             w-5 h-5 rounded-full flex items-center justify-center shrink-0">
              {nonLus > 9 ? '9+' : nonLus}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

const formatTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = Math.floor((now - date) / 86400000)
  if (diff === 0) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (diff === 1) return 'Hier'
  if (diff < 7) return date.toLocaleDateString('fr-FR', { weekday: 'short' })
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}
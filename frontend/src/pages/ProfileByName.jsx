import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api' 
import { Loader2 } from 'lucide-react'

export default function ProfileByName() {
  const { nom } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const find = async () => {
      try {
        const nomDecoded = decodeURIComponent(nom)
        console.log('Finding profile by name:', nomDecoded)
        const { data } = await api.get(
          `/api/users/by-name/${encodeURIComponent(nomDecoded)}`
        )
        navigate(`/profile/${data.id}`, { replace: true })
      } catch (err) {
        console.error('Profile not found:', err)
        navigate('/', { replace: true })
      }
    }
    find()
  }, [nom])

  return (
    <div className="flex justify-center py-20">
      <Loader2 size={28} className="animate-spin text-primary-400" />
    </div>
  )
}
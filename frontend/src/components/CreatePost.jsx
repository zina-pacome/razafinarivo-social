import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { Image, X, Send, Loader2 } from 'lucide-react'

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth()
  const [contenu, setContenu] = useState('')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setImage(null)
    setPreview(null)
    fileRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!contenu.trim() && !image) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('contenu', contenu)
      if (image) formData.append('image', image)

      const { data } = await axios.post('/api/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      onPostCreated(data)
      setContenu('')
      setImage(null)
      setPreview(null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-4">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center
                        justify-center shrink-0 overflow-hidden">
          {user?.photo_profil
            ? <img src={user.photo_profil} className="w-full h-full object-cover" />
            : <span className="text-primary-700 font-bold text-sm">
                {user?.nom?.charAt(0).toUpperCase()}
              </span>
          }
        </div>

        <div className="flex-1">
          <textarea
            value={contenu}
            onChange={e => setContenu(e.target.value)}
            placeholder={`Quoi de neuf, ${user?.nom?.split(' ')[0]} ?`}
            rows={3}
            className="w-full resize-none border-0 outline-none text-gray-800
                       placeholder:text-gray-400 text-sm bg-transparent"
          />

          {/* Preview image */}
          {preview && (
            <div className="relative mt-2 rounded-xl overflow-hidden">
              <img src={preview} className="max-h-64 w-full object-cover rounded-xl" />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 bg-gray-900/60 hover:bg-gray-900/80
                           text-white rounded-full p-1 transition-all"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-3 pt-3
                          border-t border-gray-100">
            <button
              type="button"
              onClick={() => fileRef.current.click()}
              className="flex items-center gap-2 text-sm text-gray-500
                         hover:text-primary-600 hover:bg-primary-50
                         px-3 py-1.5 rounded-lg transition-all"
            >
              <Image size={18} />
              <span>Photo</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImage}
            />

            <button
              onClick={handleSubmit}
              disabled={loading || (!contenu.trim() && !image)}
              className="btn-primary flex items-center gap-2 px-5 py-2 text-sm"
            >
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : <><Send size={16} /> Publier</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
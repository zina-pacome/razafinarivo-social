import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL,
  withCredentials: true
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.headers?.['content-type']?.includes('text/html')) {
      console.error('API returned HTML — vérifier VITE_API_URL')
    }
    return Promise.reject(error)
  }
)

export default api
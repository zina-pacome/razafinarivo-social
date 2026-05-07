import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Feed from './pages/Feed'
import Profile from './pages/Profile'
import ProfileByName from './pages/ProfileByName'
import Messages from './pages/Messages'
import Admin from './pages/Admin'

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  return user ? children : <Navigate to="/login" replace />
}

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  return user?.role === 'admin' ? children : <Navigate to="/" replace />
}

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  return !user ? children : <Navigate to="/" replace />
}

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary-200
                      border-t-primary-600 rounded-full animate-spin" />
      <p className="text-gray-500 text-sm font-medium">Chargement...</p>
    </div>
  </div>
)

export default function App() {
  return (
    <Routes>
      {/* Pages publiques */}
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Pages privées */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index                      element={<Feed />} />
        <Route path="profile/:id"         element={<Profile />} />
        <Route path="profile/search/:nom" element={<ProfileByName />} />
        <Route path="messages"            element={<Messages />} />
        <Route path="messages/:userId"    element={<Messages />} />
        <Route path="admin"               element={<AdminRoute><Admin /></AdminRoute>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
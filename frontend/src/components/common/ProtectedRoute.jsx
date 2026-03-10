import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import LoadingScreen from './LoadingScreen'

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, loading, DEV_MODE } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />

  // ── DEV MODE: skip all auth guards ───────────────────
  if (DEV_MODE) return children

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    const homeMap = { customer: '/menu', chef: '/kitchen', pickup: '/pickup', admin: '/admin' }
    return <Navigate to={homeMap[user.role] || '/'} replace />
  }

  return children
}
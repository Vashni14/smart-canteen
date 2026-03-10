import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import LoadingScreen from './LoadingScreen'

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    const homeMap = { customer: '/menu', chef: '/kitchen', pickup: '/pickup', admin: '/admin' }
    return <Navigate to={homeMap[user.role] || '/'} replace />
  }

  return children
}

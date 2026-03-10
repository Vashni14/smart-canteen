import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import api from '@services/api'

/**
 * Listens to a custom event dispatched by api.js interceptor on 401.
 * Shows a modal prompting the user to re-login without losing their page.
 */
export default function SessionExpiredModal() {
  const [show, setShow]     = useState(false)
  const { logout, DEV_MODE }= useAuth()
  const navigate            = useNavigate()

  useEffect(() => {
    if (DEV_MODE) return // skip in dev mode

    const handler = () => setShow(true)
    window.addEventListener('sc:session-expired', handler)
    return () => window.removeEventListener('sc:session-expired', handler)
  }, [DEV_MODE])

  const handleLogin = () => {
    logout()
    setShow(false)
    navigate('/login', { state: { from: { pathname: window.location.pathname } } })
  }

  const handleDismiss = () => {
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-modal max-w-sm w-full p-8 text-center space-y-5 animate-scale-in">

        <div className="w-16 h-16 mx-auto bg-canteen-warning/10 rounded-2xl flex items-center justify-center text-3xl">
          🔐
        </div>

        <div>
          <h3 className="text-xl font-display font-bold text-secondary">Session Expired</h3>
          <p className="text-canteen-muted text-sm mt-2">
            Your session has expired for security reasons. Please sign in again to continue.
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={handleDismiss} className="btn-ghost flex-1">
            Stay Here
          </button>
          <button onClick={handleLogin} className="btn-primary flex-1">
            Sign In Again
          </button>
        </div>

        <p className="text-xs text-canteen-muted">
          Your cart and preferences are saved locally.
        </p>
      </div>
    </div>
  )
}

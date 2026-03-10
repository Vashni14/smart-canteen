import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '@services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

// ── DEV MODE: bypass login ────────────────────────────────
const DEV_MODE = false

const DEV_USERS = {
  customer: { _id: 'dev-customer', name: 'Arjun (Dev)', email: 'student@college.edu', role: 'customer' },
  chef:     { _id: 'dev-chef',     name: 'Chef Ravi (Dev)', email: 'chef@college.edu', role: 'chef' },
  pickup:   { _id: 'dev-pickup',   name: 'Pickup Staff (Dev)', email: 'pickup@college.edu', role: 'pickup' },
  admin:    { _id: 'dev-admin',    name: 'Admin (Dev)', email: 'admin@college.edu', role: 'admin' },
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session from localStorage on mount
  useEffect(() => {
    if (DEV_MODE) {
      const devRole = localStorage.getItem('sc_dev_role') || 'customer'
      setUser(DEV_USERS[devRole] || DEV_USERS.customer)
      setLoading(false)
      return
    }
    const stored = localStorage.getItem('sc_user')
    const token  = localStorage.getItem('sc_token')
    if (stored && token) {
      setUser(JSON.parse(stored))
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token, user: userData } = res.data
    localStorage.setItem('sc_token', token)
    localStorage.setItem('sc_user',  JSON.stringify(userData))
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(userData)
    return userData
  }, [])

  const register = useCallback(async (formData) => {
    const res = await api.post('/auth/register', formData)
    const { token, user: userData } = res.data
    localStorage.setItem('sc_token', token)
    localStorage.setItem('sc_user',  JSON.stringify(userData))
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('sc_token')
    localStorage.removeItem('sc_user')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    toast.success('Logged out successfully')
  }, [])

  const updateProfile = useCallback((updates) => {
    const updated = { ...user, ...updates }
    localStorage.setItem('sc_user', JSON.stringify(updated))
    setUser(updated)
  }, [user])

  const devSwitchRole = useCallback((role) => {
    if (!DEV_MODE) return
    localStorage.setItem('sc_dev_role', role)
    setUser(DEV_USERS[role])
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, devSwitchRole, DEV_MODE }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
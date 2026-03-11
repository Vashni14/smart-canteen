import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

const DEV_MODE = false

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('sc_user')
    const token  = localStorage.getItem('sc_token')
    if (stored && token) {
      try {
        const parsed = JSON.parse(stored)
        setUser(parsed)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } catch {
        localStorage.removeItem('sc_user')
        localStorage.removeItem('sc_token')
      }
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

  const updateProfile = useCallback(async (updates) => {
    const res = await api.put('/auth/profile', updates)
    const updated = res.data?.user || { ...user, ...updates }
    localStorage.setItem('sc_user', JSON.stringify(updated))
    setUser(updated)
    return updated
  }, [user])

  return (
    <AuthContext.Provider value={{
      user, loading, DEV_MODE,
      login, register, logout, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

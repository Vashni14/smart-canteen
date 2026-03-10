import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

export function SocketProvider({ children }) {
  const { user }            = useAuth()
  const socketRef           = useRef(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('sc_token')

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    const s = socketRef.current

    s.on('connect',    () => setConnected(true))
    s.on('disconnect', () => setConnected(false))

    if (user) {
      s.emit('join-room', user.role)
      if (user.role === 'customer') {
        s.emit('join-room', `user-${user._id}`)
      }
    }

    return () => {
      s.disconnect()
    }
  }, [user])

  const on  = (event, cb) => socketRef.current?.on(event, cb)
  const off = (event, cb) => socketRef.current?.off(event, cb)
  const emit = (event, data) => socketRef.current?.emit(event, data)

  return (
    <SocketContext.Provider value={{ connected, on, off, emit, socket: socketRef }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocket must be used within SocketProvider')
  return ctx
}

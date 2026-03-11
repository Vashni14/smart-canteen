import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001'

export function SocketProvider({ children }) {
  const { user }                  = useAuth()
  const socketRef                 = useRef(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('sc_token')

    const socket = io(SOCKET_URL, {
      auth:                { token },
      transports:          ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay:   2000,
      reconnectionDelayMax:10000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      // Re-join rooms after reconnect
      if (user) {
        socket.emit('join-room', user.role)
        if (user.role === 'customer') {
          socket.emit('join-room', `user-${user._id}`)
        }
      }
    })

    socket.on('disconnect', () => setConnected(false))

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message)
    })

    // Join role room immediately if already have user
    if (user) {
      socket.emit('join-room', user.role)
      if (user.role === 'customer') {
        socket.emit('join-room', `user-${user._id}`)
      }
    }

    return () => {
      socket.disconnect()
    }
  }, [user?._id, user?.role])

  const on   = useCallback((event, cb) => socketRef.current?.on(event, cb),   [])
  const off  = useCallback((event, cb) => socketRef.current?.off(event, cb),  [])
  const emit = useCallback((event, data) => socketRef.current?.emit(event, data), [])

  // Join a specific order tracking room
  const joinOrder = useCallback((orderId) => {
    socketRef.current?.emit('join:order', orderId)
  }, [])

  return (
    <SocketContext.Provider value={{ connected, on, off, emit, joinOrder, socket: socketRef }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocket must be used within SocketProvider')
  return ctx
}

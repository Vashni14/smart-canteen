import { useState, useEffect, useCallback, useRef } from 'react'

/* ── useLocalStorage ─────────────────────────────────────────── */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setStoredValue = useCallback((newValue) => {
    try {
      const val = typeof newValue === 'function' ? newValue(value) : newValue
      setValue(val)
      localStorage.setItem(key, JSON.stringify(val))
    } catch (e) {
      console.error('useLocalStorage set error:', e)
    }
  }, [key, value])

  const remove = useCallback(() => {
    localStorage.removeItem(key)
    setValue(initialValue)
  }, [key, initialValue])

  return [value, setStoredValue, remove]
}

/* ── useDebounce ─────────────────────────────────────────────── */
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

/* ── useOnline ───────────────────────────────────────────────── */
export function useOnline() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online',  on)
      window.removeEventListener('offline', off)
    }
  }, [])

  return online
}

/* ── useInterval ─────────────────────────────────────────────── */
export function useInterval(callback, delay) {
  const savedCb = useRef(callback)

  useEffect(() => { savedCb.current = callback }, [callback])

  useEffect(() => {
    if (delay === null) return
    const id = setInterval(() => savedCb.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

/* ── useDisclosure ───────────────────────────────────────────── */
export function useDisclosure(initial = false) {
  const [isOpen, setIsOpen] = useState(initial)
  const open    = useCallback(() => setIsOpen(true),  [])
  const close   = useCallback(() => setIsOpen(false), [])
  const toggle  = useCallback(() => setIsOpen(v => !v), [])
  return { isOpen, open, close, toggle }
}

/* ── useClickOutside ─────────────────────────────────────────── */
export function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return
      handler(e)
    }
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler])
}

/* ── usePrevious ─────────────────────────────────────────────── */
export function usePrevious(value) {
  const ref = useRef()
  useEffect(() => { ref.current = value })
  return ref.current
}

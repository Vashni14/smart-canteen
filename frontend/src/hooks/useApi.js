import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * useApi — generic data fetching hook
 *
 * @param {Function} apiFn   — service function returning a promise
 * @param {any[]}    deps    — dependency array (re-fetches when changed)
 * @param {object}   options — { immediate: bool, initialData: any }
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApi(
 *     () => menuService.getAll({ category }),
 *     [category]
 *   )
 */
export function useApi(apiFn, deps = [], { immediate = true, initialData = null } = {}) {
  const [data,    setData]    = useState(initialData)
  const [loading, setLoading] = useState(immediate)
  const [error,   setError]   = useState(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const fetch = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFn(...args)
      if (mountedRef.current) setData(res.data)
      return res.data
    } catch (err) {
      if (mountedRef.current) setError(err?.response?.data?.message || 'Request failed')
      throw err
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (immediate) fetch()
  }, [fetch]) // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch: fetch, setData }
}

export default useApi

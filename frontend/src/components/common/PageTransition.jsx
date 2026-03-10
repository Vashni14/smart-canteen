import { useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

/**
 * Wraps route content with a smooth fade+slide animation on navigation.
 * Usage: wrap <Outlet /> in layouts with <PageTransition>.
 */
export default function PageTransition({ children }) {
  const location          = useLocation()
  const [visible, setVis] = useState(true)
  const prevPath          = useRef(location.pathname)

  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      setVis(false)
      const t = setTimeout(() => {
        setVis(true)
        prevPath.current = location.pathname
        // Scroll to top on route change
        window.scrollTo({ top: 0, behavior: 'instant' })
      }, 80)
      return () => clearTimeout(t)
    }
  }, [location.pathname])

  return (
    <div
      className="transition-all duration-200"
      style={{
        opacity:   visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
      }}
    >
      {children}
    </div>
  )
}

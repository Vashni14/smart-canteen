import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'

const ROLES = [
  { role: 'customer', icon: '🧑‍🎓', label: 'Customer', home: '/menu',    color: 'bg-primary' },
  { role: 'chef',     icon: '👨‍🍳', label: 'Chef',     home: '/kitchen', color: 'bg-orange-500' },
  { role: 'pickup',   icon: '📦',   label: 'Pickup',   home: '/pickup',  color: 'bg-blue-500' },
  { role: 'admin',    icon: '🛡️',  label: 'Admin',    home: '/admin',   color: 'bg-purple-600' },
]

const PAGES = {
  customer: [
    { label: '🏠 Landing',       path: '/' },
    { label: '📋 Login',         path: '/login' },
    { label: '📝 Register',      path: '/register' },
    { label: '🍔 Menu',          path: '/menu' },
    { label: '🛒 Cart',          path: '/cart' },
    { label: '💳 Checkout',      path: '/checkout' },
    { label: '📦 Orders',        path: '/orders' },
    { label: '🔴 Track Order',   path: '/orders/dev-order-1/track' },
  ],
  chef: [
    { label: '👨‍🍳 Kitchen KDS', path: '/kitchen' },
  ],
  pickup: [
    { label: '📦 Pickup Counter', path: '/pickup' },
  ],
  admin: [
    { label: '📊 Dashboard',   path: '/admin' },
    { label: '🍔 Menu Mgmt',   path: '/admin/menu' },
    { label: '📋 Orders',      path: '/admin/orders' },
    { label: '🏪 Inventory',   path: '/admin/inventory' },
    { label: '👥 Staff',       path: '/admin/staff' },
    { label: '📈 Reports',     path: '/admin/reports' },
  ],
}

export default function DevToolbar() {
  const { user, devSwitchRole } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [open, setOpen] = useState(true)
  const [minimized, setMinimized] = useState(false)

  if (!user) return null

  const currentRole = ROLES.find(r => r.role === user.role) || ROLES[0]
  const pages       = PAGES[user.role] || []

  const switchRole = (role) => {
    devSwitchRole(role)
    const home = ROLES.find(r => r.role === role)?.home || '/'
    navigate(home, { replace: true })
  }

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 z-[999] w-12 h-12 rounded-full bg-secondary text-white shadow-modal flex items-center justify-center text-xl hover:scale-110 transition-transform"
        title="Open Dev Toolbar"
      >
        🛠
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-[999] w-64 shadow-modal rounded-2xl overflow-hidden border border-white/10 animate-slide-up">

      {/* Header */}
      <div className="bg-secondary px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">🛠</span>
          <span className="text-white text-xs font-bold tracking-wide">DEV PREVIEW</span>
        </div>
        <button
          onClick={() => setMinimized(true)}
          className="text-white/60 hover:text-white text-lg leading-none"
          title="Minimize"
        >
          —
        </button>
      </div>

      {/* Role switcher */}
      <div className="bg-secondary/90 px-3 py-2 space-y-1.5">
        <p className="text-white/50 text-[10px] font-bold tracking-widest uppercase">Viewing as</p>
        <div className="grid grid-cols-2 gap-1.5">
          {ROLES.map(r => (
            <button
              key={r.role}
              onClick={() => switchRole(r.role)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all
                ${user.role === r.role
                  ? `${r.color} text-white shadow-sm`
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
            >
              <span>{r.icon}</span>
              <span>{r.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Page nav */}
      <div className="bg-white border-t border-canteen-border">
        <p className="text-[10px] font-bold tracking-widest uppercase text-canteen-muted px-3 pt-2.5 pb-1">
          {currentRole.label} Pages
        </p>
        <div className="max-h-52 overflow-y-auto no-scrollbar pb-2">
          {pages.map(p => (
            <button
              key={p.path}
              onClick={() => navigate(p.path)}
              className={`w-full text-left px-3 py-1.5 text-xs font-semibold transition-colors
                ${location.pathname === p.path || (p.path !== '/' && location.pathname.startsWith(p.path))
                  ? 'bg-primary/10 text-primary'
                  : 'text-secondary hover:bg-canteen-bg'
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
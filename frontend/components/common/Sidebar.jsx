import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'

const MENUS = {
  chef: [
    { to: '/kitchen', label: 'Kitchen Display', icon: '👨‍🍳', end: true },
  ],
  pickup: [
    { to: '/pickup',  label: 'Ready Orders',    icon: '📦', end: true },
  ],
  admin: [
    { to: '/admin',          label: 'Dashboard',   icon: '📊', end: true },
    { to: '/admin/menu',     label: 'Menu',         icon: '🍔' },
    { to: '/admin/orders',   label: 'Orders',       icon: '📋' },
    { to: '/admin/inventory',label: 'Inventory',    icon: '🏪' },
    { to: '/admin/staff',    label: 'Staff',        icon: '👥' },
    { to: '/admin/reports',  label: 'Reports',      icon: '📈' },
  ],
}

const ROLE_LABELS = { chef: 'Kitchen', pickup: 'Pickup', admin: 'Admin' }

export default function Sidebar({ role }) {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const links            = MENUS[role] || []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-60 min-h-screen bg-secondary flex flex-col shadow-lg flex-shrink-0">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-secondary-600">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center">
            <span className="text-lg">🍽️</span>
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm leading-none">SmartCanteen</p>
            <p className="text-xs text-secondary-300 capitalize mt-0.5">{ROLE_LABELS[role]} Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {links.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-primary'
                  : 'text-secondary-200 hover:bg-secondary-600 hover:text-white'
              }`
            }
          >
            <span className="text-lg">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-secondary-600">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-secondary-300 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-sm font-semibold text-secondary-300 hover:text-white py-1.5 rounded-lg hover:bg-secondary-600 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}

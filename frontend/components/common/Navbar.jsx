import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import { useCart } from '@context/CartContext'

export default function Navbar() {
  const { user, logout }  = useAuth()
  const { totalItems }    = useCart()
  const navigate          = useNavigate()
  const { pathname }      = useLocation()

  const navLinks = [
    { to: '/',      label: 'Home' },
    { to: '/menu',  label: 'Menu' },
  ]
  if (user) {
    navLinks.push({ to: '/orders', label: 'My Orders' })
  }

  return (
    <header className="bg-white shadow-nav sticky top-0 z-50">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-primary">
              <span className="text-lg">🍽️</span>
            </div>
            <span className="font-display font-bold text-xl text-secondary">
              Smart<span className="text-primary">Canteen</span>
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  pathname === to
                    ? 'bg-primary/10 text-primary'
                    : 'text-secondary-400 hover:text-secondary hover:bg-gray-100'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
              title="Cart"
            >
              <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>

            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-bold text-secondary leading-none">{user.name}</span>
                  <span className="text-[10px] text-canteen-muted capitalize">{user.role}</span>
                </div>
                <button
                  onClick={logout}
                  className="btn btn-outline btn-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login"    className="btn btn-ghost btn-sm">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

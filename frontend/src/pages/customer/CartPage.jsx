import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '@context/CartContext'
import { useAuth } from '@context/AuthContext'
import { menuService } from '@services/index'
import CartItem from '@components/common/CartItem'
import { EmptyCart } from '@components/common/EmptyState'
import { formatCurrency } from '@utils/index'
import toast from 'react-hot-toast'

export default function CartPage() {
  const { items, totalAmount, clearCart, removeItem } = useCart()
  const { user }   = useAuth()
  const navigate   = useNavigate()

  const [checking, setChecking]     = useState(false)
  const [unavailable, setUnavail]   = useState([])

  // Check item availability before checkout
  const verifyItems = async () => {
    setChecking(true)
    try {
      const res    = await menuService.getAll()
      const menu   = res.data?.items || res.data || []
      const menuMap = Object.fromEntries(menu.map(m => [m._id, m]))

      const bad = items.filter(i => {
        const live = menuMap[i._id]
        return !live || !live.available
      })
      setUnavail(bad.map(i => i._id))
      return bad
    } catch {
      return []
    } finally {
      setChecking(false)
    }
  }

  const handleProceed = async () => {
    if (!user) {
      toast.error('Please login to continue')
      navigate('/login', { state: { from: { pathname: '/checkout' } } })
      return
    }
    const bad = await verifyItems()
    if (bad.length > 0) {
      toast.error(`${bad.length} item(s) are no longer available. Remove them to proceed.`)
      return
    }
    navigate('/checkout')
  }

  const removeUnavailable = () => {
    unavailable.forEach(id => removeItem(id))
    setUnavail([])
    toast.success('Unavailable items removed')
  }

  const delivery = 0          // Free pickup
  const taxes    = Math.round(totalAmount * 0.05)
  const grandTotal = totalAmount + taxes

  if (items.length === 0) {
    return (
      <div className="page-container page-section">
        <h1 className="section-title mb-6">Your Cart</h1>
        <EmptyCart onBrowse={() => navigate('/menu')} />
      </div>
    )
  }

  return (
    <div className="page-container page-section animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Your Cart</h1>
          <p className="section-subtitle">{items.length} item(s)</p>
        </div>
        <button
          onClick={() => { clearCart(); toast.success('Cart cleared') }}
          className="btn-ghost btn-sm text-canteen-danger hover:bg-red-50"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Cart items */}
        <div className="lg:col-span-2 space-y-3">

          {/* Unavailable warning */}
          {unavailable.length > 0 && (
            <div className="alert-danger">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="font-bold">
                  {unavailable.length} item(s) became unavailable
                </p>
                <p className="text-sm opacity-90">
                  Remove them before proceeding to checkout.
                </p>
              </div>
              <button onClick={removeUnavailable} className="btn-danger btn-sm flex-shrink-0">
                Remove All
              </button>
            </div>
          )}

          <div className="card">
            <div className="card-body divide-y divide-canteen-border p-0">
              {items.map(item => (
                <div
                  key={item._id}
                  className={`px-5 ${unavailable.includes(item._id) ? 'opacity-60 bg-red-50/50' : ''}`}
                >
                  {unavailable.includes(item._id) && (
                    <p className="text-xs text-canteen-danger font-bold pt-3">⚠ No longer available</p>
                  )}
                  <CartItem item={item} />
                </div>
              ))}
            </div>
          </div>

          {/* Continue shopping */}
          <Link to="/menu" className="btn-ghost btn-sm w-fit">
            ← Continue Shopping
          </Link>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="card card-body sticky top-24 space-y-4">
            <h3 className="card-title">Order Summary</h3>

            {/* Line items */}
            <div className="space-y-2 text-sm">
              {items.map(item => (
                <div key={item._id} className="flex justify-between text-canteen-muted">
                  <span className="truncate mr-2">{item.name} ×{item.qty}</span>
                  <span className="flex-shrink-0 font-semibold text-secondary">
                    {formatCurrency(item.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>

            <div className="divider" />

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-canteen-muted">
                <span>Subtotal</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-canteen-muted">
                <span>GST (5%)</span>
                <span>{formatCurrency(taxes)}</span>
              </div>
              <div className="flex justify-between text-canteen-muted">
                <span>Pickup</span>
                <span className="text-canteen-success font-bold">Free</span>
              </div>
            </div>

            <div className="divider" />

            <div className="flex justify-between font-display font-bold text-secondary text-lg">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(grandTotal)}</span>
            </div>

            <button
              onClick={handleProceed}
              disabled={checking || unavailable.length > 0}
              className="btn-primary w-full btn-lg"
            >
              {checking ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Checking availability…
                </span>
              ) : 'Proceed to Checkout →'}
            </button>

            {/* Trust note */}
            <p className="text-xs text-canteen-muted text-center">
              🔒 Secure checkout · Free canteen pickup
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

function Spinner() {
  return <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
}

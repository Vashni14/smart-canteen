import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import { orderService } from '@services/index'
import { useCart } from '@context/CartContext'
import { menuService } from '@services/index'
import LoadingSkeleton from '@components/common/LoadingSkeleton'
import { EmptyOrders } from '@components/common/EmptyState'
import ErrorState from '@components/common/ErrorState'
import { formatCurrency, formatDate, getStatusClass } from '@utils/index'
import toast from 'react-hot-toast'

const STATUS_TABS = ['All', 'Active', 'Completed', 'Cancelled']

export default function OrderHistoryPage() {
  const { user }       = useAuth()
  const { addItem }    = useCart()

  const [orders, setOrders] = useState([])
  const [loading, setLoad]  = useState(true)
  const [error, setError]   = useState(null)
  const [tab, setTab]       = useState('All')

  const fetchOrders = async () => {
    if (!user) return
    setLoad(true)
    try {
      const res = await orderService.getMyOrders(user._id)
      setOrders(res.data?.orders || res.data || [])
      setError(null)
    } catch {
      setError('Failed to load orders')
    } finally {
      setLoad(false)
    }
  }

  useEffect(() => { fetchOrders() }, [user])

  const ACTIVE_STATUSES    = ['pending', 'accepted', 'preparing', 'ready']
  const COMPLETED_STATUSES = ['collected']
  const CANCELLED_STATUSES = ['cancelled']

  const filtered = orders.filter(o => {
    if (tab === 'All')       return true
    if (tab === 'Active')    return ACTIVE_STATUSES.includes(o.status)
    if (tab === 'Completed') return COMPLETED_STATUSES.includes(o.status)
    if (tab === 'Cancelled') return CANCELLED_STATUSES.includes(o.status)
    return true
  })

  const handleReorder = async (order) => {
    try {
      // Fetch current menu to check availability
      const res   = await menuService.getAll()
      const menu  = res.data?.items || res.data || []
      const menuMap = Object.fromEntries(menu.map(m => [m._id, m]))

      let added = 0
      order.items.forEach(item => {
        const live = menuMap[item.menuItem || item._id]
        if (live?.available) {
          addItem(live, item.qty, item.note)
          added++
        }
      })

      if (added === 0) {
        toast.error('None of these items are currently available')
      } else if (added < order.items.length) {
        toast.success(`${added} of ${order.items.length} items added (others unavailable)`)
      } else {
        toast.success('All items added to cart!')
      }
    } catch {
      toast.error('Failed to reorder')
    }
  }

  if (loading) return (
    <div className="page-container page-section">
      <LoadingSkeleton variant="order-list" count={4} />
    </div>
  )

  if (error) return (
    <div className="page-container page-section">
      <ErrorState title="Failed to Load" message={error} onRetry={fetchOrders} />
    </div>
  )

  return (
    <div className="page-container page-section animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">My Orders</h1>
          <p className="section-subtitle">{orders.length} total order(s)</p>
        </div>
        <Link to="/menu" className="btn-primary btn-sm">+ New Order</Link>
      </div>

      {/* Tabs */}
      <div className="tab-list mb-5 max-w-sm">
        {STATUS_TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={t === tab ? 'tab-btn-active' : 'tab-btn'}
          >
            {t}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyOrders />
      ) : (
        <div className="space-y-4">
          {filtered.map((order, i) => (
            <OrderCard
              key={order._id}
              order={order}
              index={i}
              onReorder={() => handleReorder(order)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function OrderCard({ order, index, onReorder }) {
  const orderNum = order.orderNumber || order._id?.slice(-6).toUpperCase()
  const isActive = ['pending', 'accepted', 'preparing', 'ready'].includes(order.status)

  return (
    <div
      className="card card-hover animate-slide-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="card-body">
        <div className="flex items-start justify-between gap-4">

          {/* Left */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-secondary text-sm">#{orderNum}</span>
              <span className={getStatusClass(order.status)}>{order.status}</span>
              {isActive && (
                <span className="flex items-center gap-1 text-xs font-semibold text-canteen-success">
                  <span className="w-1.5 h-1.5 rounded-full bg-canteen-success animate-pulse-soft" />
                  Live
                </span>
              )}
            </div>

            <p className="text-sm text-canteen-muted mt-1">{formatDate(order.createdAt)}</p>

            {/* Items summary */}
            <p className="text-sm text-secondary mt-2 line-clamp-1">
              {order.items?.map(i => `${i.name} ×${i.qty}`).join(', ')}
            </p>
          </div>

          {/* Right */}
          <div className="text-right flex-shrink-0">
            <p className="price-text">{formatCurrency(order.totalPrice)}</p>
            <p className="text-xs text-canteen-muted mt-0.5">{order.items?.length} item(s)</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-3 border-t border-canteen-border">
          {isActive ? (
            <Link to={`/orders/${order._id}/track`} className="btn-primary btn-sm flex-1 justify-center">
              🔴 Track Live
            </Link>
          ) : (
            <Link to={`/orders/${order._id}/track`} className="btn-outline btn-sm flex-1 justify-center">
              View Details
            </Link>
          )}
          {order.status === 'collected' && (
            <button onClick={onReorder} className="btn-ghost btn-sm flex-1">
              🔄 Reorder
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

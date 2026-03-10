import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { orderService } from '@services/index'
import { useSocket } from '@context/SocketContext'
import OrderStatusTracker from '@components/common/OrderStatusTracker'
import QRCodeDisplay from '@components/common/QRCodeDisplay'
import LoadingSkeleton from '@components/common/LoadingSkeleton'
import ErrorState from '@components/common/ErrorState'
import { formatCurrency, formatTime, getStatusClass } from '@utils/index'
import { useInterval } from '@hooks/useHelpers'
import toast from 'react-hot-toast'

export default function OrderTrackPage() {
  const { id }           = useParams()
  const { on, off }      = useSocket()

  const [order, setOrder]   = useState(null)
  const [loading, setLoad]  = useState(true)
  const [error, setError]   = useState(null)
  const [elapsed, setElapsed] = useState(0)

  const fetchOrder = async () => {
    try {
      const res = await orderService.getById(id)
      setOrder(res.data?.order || res.data)
      setError(null)
    } catch (err) {
      setError(err?.response?.data?.message || 'Order not found')
    } finally {
      setLoad(false)
    }
  }

  useEffect(() => { fetchOrder() }, [id])

  // Poll every 30s as fallback
  useInterval(fetchOrder, 30_000)

  // Elapsed timer (updates every minute display)
  useInterval(() => setElapsed(e => e + 1), 60_000)

  // Real-time status update via socket
  useEffect(() => {
    const handler = (updated) => {
      if (updated._id === id || updated.orderId === id) {
        setOrder(prev => ({ ...prev, ...updated }))
        toast.success(`Order status: ${updated.status?.toUpperCase()} 🔔`)
      }
    }
    on('order:status-updated', handler)
    return () => off('order:status-updated', handler)
  }, [id, on, off])

  if (loading) return (
    <div className="page-container page-section">
      <LoadingSkeleton variant="detail" />
    </div>
  )

  if (error) return (
    <div className="page-container page-section">
      <ErrorState title="Order Not Found" message={error} onRetry={fetchOrder} />
    </div>
  )

  if (!order) return null

  const orderNum = order.orderNumber || order._id?.slice(-6).toUpperCase()

  return (
    <div className="page-container page-section animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Track Order</h1>
          <p className="section-subtitle">
            <span className="font-mono font-bold text-secondary">#{orderNum}</span>
            {' · '}{formatTime(order.createdAt)}
          </p>
        </div>
        <span className={getStatusClass(order.status)}>
          {order.status}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left: tracker + items */}
        <div className="lg:col-span-2 space-y-5">

          {/* Status tracker */}
          <OrderStatusTracker
            status={order.status}
            estimatedTime={order.estimatedTime}
          />

          {/* Kitchen delay notice */}
          {order.status === 'accepted' && elapsed > 10 && (
            <div className="alert-warning animate-fade-in">
              ⏱ Your order is taking a bit longer than usual. The kitchen is on it!
            </div>
          )}

          {/* Order items */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Order Items</h3>
              <span className="text-sm text-canteen-muted">{order.items?.length} item(s)</span>
            </div>
            <div className="card-body divide-y divide-canteen-border p-0">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {item.qty}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-secondary text-sm">{item.name}</p>
                    {item.note && (
                      <p className="text-xs text-canteen-muted italic">"{item.note}"</p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-secondary">
                    {formatCurrency(item.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>
            <div className="card-footer flex justify-between">
              <span className="text-sm text-canteen-muted">Total Paid</span>
              <span className="price-text">{formatCurrency(order.totalPrice)}</span>
            </div>
          </div>

          {/* Special notes */}
          {order.notes && (
            <div className="card card-body">
              <p className="label-text mb-1">Your Note</p>
              <p className="text-sm text-secondary italic">"{order.notes}"</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Link to="/orders" className="btn-outline flex-1 justify-center">
              All Orders
            </Link>
            <Link to="/menu" className="btn-primary flex-1 justify-center">
              Order Again
            </Link>
          </div>
        </div>

        {/* Right: QR code */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <QRCodeDisplay
              orderId={order._id}
              orderNumber={orderNum}
              status={order.status}
            />

            {/* Pickup info */}
            {order.status === 'ready' && (
              <div className="alert-success animate-scale-in">
                <span className="text-xl">🛎️</span>
                <div>
                  <p className="font-bold">Ready for Pickup!</p>
                  <p className="text-sm opacity-90">Head to the canteen counter and show your QR code.</p>
                </div>
              </div>
            )}

            {order.status === 'collected' && (
              <div className="alert-info animate-scale-in">
                <span className="text-xl">✅</span>
                <div>
                  <p className="font-bold">Order Collected</p>
                  <p className="text-sm opacity-90">Enjoy your meal! 😊</p>
                </div>
              </div>
            )}

            {/* Double-scan protection notice */}
            {order.status === 'collected' && (
              <p className="text-xs text-canteen-muted text-center">
                This QR code has been used and is now expired.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

import { useState, useEffect, useRef, useCallback } from 'react'
import { orderService } from '@services/index'
import { useSocket } from '@context/SocketContext'
import { useInterval } from '@hooks/useHelpers'
import KitchenOrderCard from '@components/kitchen/KitchenOrderCard'
import KitchenStatsBar from '@components/kitchen/KitchenStatsBar'
import LoadingSkeleton from '@components/common/LoadingSkeleton'
import { EmptyKitchen } from '@components/common/EmptyState'
import ErrorState from '@components/common/ErrorState'
import toast from 'react-hot-toast'

/* ── KDS Column definitions ──────────────────────────────── */
const COLUMNS = [
  {
    id:       'pending',
    label:    'New Orders',
    icon:     '🆕',
    statuses: ['pending'],
    bg:       'bg-blue-50/50',
    header:   'border-t-4 border-canteen-info',
  },
  {
    id:       'in-progress',
    label:    'In Progress',
    icon:     '🔥',
    statuses: ['accepted', 'preparing'],
    bg:       'bg-orange-50/50',
    header:   'border-t-4 border-primary',
  },
  {
    id:       'ready',
    label:    'Ready for Pickup',
    icon:     '🛎️',
    statuses: ['ready'],
    bg:       'bg-green-50/50',
    header:   'border-t-4 border-canteen-success',
  },
]

/* ── Audio bell for new orders ───────────────────────────── */
function playBell() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
  } catch {}
}

export default function KitchenDashboard() {
  const { on, off }           = useSocket()
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [newIds, setNewIds]   = useState(new Set())
  const [soundOn, setSoundOn] = useState(true)
  const [view, setView]       = useState('board')  // 'board' | 'list'
  const [filterStatus, setFilter] = useState('all')
  const prevCountRef = useRef(0)

  /* ── Fetch active kitchen orders ─────────────────────── */
  const fetchOrders = useCallback(async () => {
    try {
      const res = await orderService.getKitchen()
      const data = res.data?.orders || res.data || []
      setOrders(data)
      setError(null)
    } catch {
      setError('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // Refresh every 60s as backup
  useInterval(fetchOrders, 60_000)

  /* ── Socket: new order arrives ───────────────────────── */
  useEffect(() => {
    const handleNew = (order) => {
      setOrders(prev => {
        // Avoid duplicates
        if (prev.find(o => o._id === order._id)) return prev
        return [order, ...prev]
      })
      setNewIds(prev => new Set([...prev, order._id]))
      if (soundOn) playBell()
      toast('🆕 New order received!', {
        icon: '🍔',
        style: { background: '#2E3A59', color: '#fff', fontWeight: '700' },
        duration: 4000,
      })
      // Remove "new" highlight after 8s
      setTimeout(() => {
        setNewIds(prev => { const s = new Set(prev); s.delete(order._id); return s })
      }, 8_000)
    }

    const handleStatusUpdate = (updated) => {
      setOrders(prev => prev.map(o =>
        o._id === updated._id || o._id === updated.orderId
          ? { ...o, ...updated }
          : o
      ))
    }

    const handleCancel = ({ orderId }) => {
      setOrders(prev => prev.filter(o => o._id !== orderId))
      toast.error('Order cancelled by customer')
    }

    on('order:new',            handleNew)
    on('order:status-updated', handleStatusUpdate)
    on('order:cancelled',      handleCancel)

    return () => {
      off('order:new',            handleNew)
      off('order:status-updated', handleStatusUpdate)
      off('order:cancelled',      handleCancel)
    }
  }, [on, off, soundOn])

  /* ── Status change handler ───────────────────────────── */
  const handleStatusChange = async (orderId, newStatus) => {
    // Optimistic update
    setOrders(prev => prev.map(o =>
      o._id === orderId ? { ...o, status: newStatus } : o
    ))
    try {
      await orderService.updateStatus(orderId, newStatus)
      if (newStatus === 'ready') {
        toast.success('Order marked as Ready! 🛎️')
      }
    } catch (err) {
      // Rollback on error
      fetchOrders()
      toast.error('Failed to update order status')
    }
  }

  /* ── Filter helpers ──────────────────────────────────── */
  const activeOrders = orders.filter(o =>
    !['collected', 'cancelled'].includes(o.status)
  )

  const getColumnOrders = (statuses) =>
    activeOrders
      .filter(o => statuses.includes(o.status))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) // oldest first

  /* ── Render ──────────────────────────────────────────── */
  if (loading) return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => <div key={i} className="skeleton h-8" />)}
      </div>
      <LoadingSkeleton variant="order-list" count={4} />
    </div>
  )

  if (error) return (
    <ErrorState title="Kitchen Error" message={error} onRetry={fetchOrders} />
  )

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header bar ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Kitchen Display System</h2>
          <p className="section-subtitle">
            {activeOrders.length} active order{activeOrders.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound toggle */}
          <button
            onClick={() => setSoundOn(v => !v)}
            className={`btn-sm ${soundOn ? 'btn-accent' : 'btn-ghost'}`}
            title={soundOn ? 'Mute alerts' : 'Enable alerts'}
          >
            {soundOn ? '🔔' : '🔕'}
          </button>

          {/* View toggle */}
          <div className="tab-list p-1">
            <button
              onClick={() => setView('board')}
              className={view === 'board' ? 'tab-btn-active' : 'tab-btn'}
            >
              Board
            </button>
            <button
              onClick={() => setView('list')}
              className={view === 'list' ? 'tab-btn-active' : 'tab-btn'}
            >
              List
            </button>
          </div>

          {/* Refresh */}
          <button onClick={fetchOrders} className="btn-ghost btn-icon" title="Refresh">
            <RefreshIcon />
          </button>
        </div>
      </div>

      {/* ── Stats bar ──────────────────────────────────── */}
      <KitchenStatsBar orders={activeOrders} />

      {/* ── No orders ──────────────────────────────────── */}
      {activeOrders.length === 0 && (
        <EmptyKitchen />
      )}

      {/* ── Board view (3 columns) ──────────────────────── */}
      {activeOrders.length > 0 && view === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map(col => {
            const colOrders = getColumnOrders(col.statuses)
            return (
              <div key={col.id} className={`rounded-2xl ${col.bg} p-4 space-y-3 min-h-[300px]`}>
                {/* Column header */}
                <div className={`card card-body py-3 ${col.header}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{col.icon}</span>
                      <span className="font-display font-bold text-secondary text-sm">{col.label}</span>
                    </div>
                    <span className="w-6 h-6 rounded-full bg-secondary text-white text-xs font-bold flex items-center justify-center">
                      {colOrders.length}
                    </span>
                  </div>
                </div>

                {/* Orders in column */}
                {colOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-canteen-muted text-sm">
                    <span className="text-2xl mb-2 opacity-40">{col.icon}</span>
                    <span className="text-xs">No orders here</span>
                  </div>
                ) : (
                  colOrders.map(order => (
                    <KitchenOrderCard
                      key={order._id}
                      order={order}
                      onStatusChange={handleStatusChange}
                      isNew={newIds.has(order._id)}
                    />
                  ))
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── List view ──────────────────────────────────── */}
      {activeOrders.length > 0 && view === 'list' && (
        <div className="space-y-3">
          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'accepted', 'preparing', 'ready'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`tab-pill ${filterStatus === s ? 'tab-pill-active' : ''} capitalize`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>

          {activeOrders
            .filter(o => filterStatus === 'all' || o.status === filterStatus)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            .map(order => (
              <KitchenOrderCard
                key={order._id}
                order={order}
                onStatusChange={handleStatusChange}
                isNew={newIds.has(order._id)}
              />
            ))
          }
        </div>
      )}

    </div>
  )
}

function RefreshIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

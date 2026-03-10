import { useState, useEffect } from 'react'
import { formatCurrency, formatTime } from '@utils/index'

/* ── Priority colour based on wait time ─────────────────────── */
function getPriority(createdAt, status) {
  if (status === 'ready') return 'ready'
  const mins = Math.floor((Date.now() - new Date(createdAt)) / 60_000)
  if (mins >= 15) return 'urgent'
  if (mins >= 8)  return 'warning'
  return 'normal'
}

const PRIORITY_STYLES = {
  urgent:  { bar: 'order-card-urgent',  badge: 'bg-red-100 text-red-700',    label: 'URGENT',  ring: 'ring-2 ring-canteen-danger/40' },
  warning: { bar: 'order-card-normal',  badge: 'bg-orange-100 text-orange-700', label: 'DELAYED', ring: 'ring-1 ring-canteen-warning/30' },
  normal:  { bar: 'order-card-new',     badge: 'bg-blue-100 text-blue-700',   label: 'NEW',     ring: '' },
  ready:   { bar: 'order-card-ready',   badge: 'bg-green-100 text-green-700', label: 'READY',   ring: '' },
}

const NEXT_ACTION = {
  pending:   { label: 'Accept Order',    icon: '✅', cls: 'btn-primary',   next: 'accepted' },
  accepted:  { label: 'Start Preparing', icon: '🔥', cls: 'btn-accent',    next: 'preparing' },
  preparing: { label: 'Mark Ready',      icon: '🛎️', cls: 'btn-success',   next: 'ready' },
}

const PREV_STATUS = {
  accepted:  'pending',
  preparing: 'accepted',
  ready:     'preparing',
}

export default function KitchenOrderCard({ order, onStatusChange, isNew }) {
  const [loading, setLoading]   = useState(false)
  const [elapsed, setElapsed]   = useState(0)
  const [expanded, setExpanded] = useState(true)

  const priority = getPriority(order.createdAt, order.status)
  const style    = PRIORITY_STYLES[priority]
  const action   = NEXT_ACTION[order.status]
  const orderNum = order.orderNumber || order._id?.slice(-6).toUpperCase()

  // Live elapsed timer — updates every 30s
  useEffect(() => {
    const update = () =>
      setElapsed(Math.floor((Date.now() - new Date(order.createdAt)) / 60_000))
    update()
    const id = setInterval(update, 30_000)
    return () => clearInterval(id)
  }, [order.createdAt])

  const handleAction = async () => {
    if (!action) return
    setLoading(true)
    try {
      await onStatusChange(order._id, action.next)
    } finally {
      setLoading(false)
    }
  }

  const handleUndo = async () => {
    const prev = PREV_STATUS[order.status]
    if (!prev) return
    setLoading(true)
    try {
      await onStatusChange(order._id, prev)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`
      card overflow-hidden transition-all duration-300
      ${style.bar} ${style.ring}
      ${isNew ? 'animate-scale-in' : 'animate-fade-in'}
      ${order.status === 'ready' ? 'opacity-80' : ''}
    `}>

      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 bg-canteen-bg border-b border-canteen-border">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-secondary text-sm">#{orderNum}</span>
          <span className={`badge text-xs font-bold px-2 py-0.5 ${style.badge}`}>
            {style.label}
          </span>
          {priority === 'urgent' && (
            <span className="animate-wiggle inline-block">🔴</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Elapsed time */}
          <ElapsedBadge mins={elapsed} status={order.status} />
          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-canteen-muted hover:text-secondary transition-colors"
          >
            <ChevronIcon open={expanded} />
          </button>
        </div>
      </div>

      {/* Order meta */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <div>
          <p className="text-xs text-canteen-muted">
            {order.userId?.name || 'Customer'} · {formatTime(order.createdAt)}
          </p>
          <p className="text-xs text-canteen-muted mt-0.5">
            {order.items?.length} item(s) · {formatCurrency(order.totalPrice)}
          </p>
        </div>
        <span className={`status-${order.status}`}>{order.status}</span>
      </div>

      {/* Items list — collapsible */}
      {expanded && (
        <div className="px-4 pb-3 space-y-2 animate-slide-down">
          <div className="divider-sm" />
          {order.items?.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {item.qty}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-secondary leading-tight">{item.name}</p>
                {item.note && (
                  <p className="text-xs text-canteen-warning font-semibold mt-0.5 flex items-center gap-1">
                    <span>📝</span> {item.note}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Order-level note */}
          {order.notes && (
            <div className="mt-2 p-2 bg-accent/10 rounded-lg border border-accent/30">
              <p className="text-xs font-bold text-secondary flex items-center gap-1">
                <span>📋</span> Order Note
              </p>
              <p className="text-xs text-secondary mt-0.5">{order.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {order.status !== 'ready' && order.status !== 'collected' && order.status !== 'cancelled' && (
        <div className="px-4 pb-4 space-y-2">
          <div className="divider-sm" />
          <div className="flex gap-2">
            {/* Main action */}
            {action && (
              <button
                onClick={handleAction}
                disabled={loading}
                className={`${action.cls} flex-1 text-sm`}
              >
                {loading ? <Spinner /> : (
                  <><span>{action.icon}</span> {action.label}</>
                )}
              </button>
            )}

            {/* Undo */}
            {PREV_STATUS[order.status] && (
              <button
                onClick={handleUndo}
                disabled={loading}
                className="btn-ghost btn-sm px-3"
                title="Undo last action"
              >
                ↩
              </button>
            )}
          </div>
        </div>
      )}

      {/* Ready state footer */}
      {order.status === 'ready' && (
        <div className="px-4 pb-4">
          <div className="divider-sm" />
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-canteen-success flex items-center gap-1">
              🛎️ Waiting for pickup
            </p>
            <button
              onClick={handleUndo}
              disabled={loading}
              className="btn-ghost btn-xs text-canteen-muted"
            >
              ↩ Undo
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────── */
function ElapsedBadge({ mins, status }) {
  if (status === 'ready' || status === 'collected') return null
  const color = mins >= 15 ? 'text-canteen-danger font-bold'
    : mins >= 8  ? 'text-canteen-warning font-bold'
    : 'text-canteen-muted'
  return (
    <span className={`text-xs ${color} flex items-center gap-1`}>
      ⏱ {mins}m
    </span>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

import { formatCurrency, formatTime, getStatusClass } from '@utils/index'

export default function OrderTable({ orders = [], onStatusChange, onView, loading }) {
  if (loading) return <OrderTableSkeleton />
  if (!orders.length) return (
    <div className="table-container">
      <div className="empty-state py-12">
        <p className="empty-state-icon">📋</p>
        <p className="empty-state-title">No orders found</p>
        <p className="empty-state-desc">Orders will appear here as customers place them</p>
      </div>
    </div>
  )

  return (
    <div className="table-container overflow-x-auto animate-fade-in">
      <table className="table-base">
        <thead className="table-thead">
          <tr>
            <th className="table-th">Order</th>
            <th className="table-th">Customer</th>
            <th className="table-th">Items</th>
            <th className="table-th">Total</th>
            <th className="table-th">Time</th>
            <th className="table-th">Status</th>
            {(onStatusChange || onView) && <th className="table-th text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <OrderRow
              key={order._id}
              order={order}
              onStatusChange={onStatusChange}
              onView={onView}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OrderRow({ order, onStatusChange, onView }) {
  const itemSummary = order.items
    ?.slice(0, 2)
    .map(i => `${i.name} ×${i.qty}`)
    .join(', ') + (order.items?.length > 2 ? ` +${order.items.length - 2} more` : '')

  return (
    <tr className="table-tr animate-slide-in">
      <td className="table-td">
        <span className="font-mono font-bold text-xs text-secondary">
          #{order.orderNumber || order._id?.slice(-6).toUpperCase()}
        </span>
      </td>
      <td className="table-td">
        <p className="font-semibold text-secondary text-sm">{order.userId?.name || 'Guest'}</p>
        <p className="text-xs text-canteen-muted">{order.userId?.email}</p>
      </td>
      <td className="table-td">
        <p className="text-sm text-secondary max-w-[180px] truncate">{itemSummary}</p>
        <p className="text-xs text-canteen-muted">{order.items?.length} item(s)</p>
      </td>
      <td className="table-td">
        <span className="price-text text-sm">{formatCurrency(order.totalPrice)}</span>
      </td>
      <td className="table-td">
        <p className="text-sm text-secondary">{formatTime(order.createdAt)}</p>
        <p className="text-xs text-canteen-muted"><TimeAgo date={order.createdAt} /></p>
      </td>
      <td className="table-td">
        <span className={getStatusClass(order.status)}>{order.status}</span>
      </td>
      {(onStatusChange || onView) && (
        <td className="table-td text-right">
          <div className="flex items-center justify-end gap-2">
            {onView && (
              <button
                onClick={() => onView(order)}
                className="btn-ghost btn-sm"
              >
                View
              </button>
            )}
            {onStatusChange && order.status !== 'collected' && order.status !== 'cancelled' && (
              <NextStatusButton order={order} onStatusChange={onStatusChange} />
            )}
          </div>
        </td>
      )}
    </tr>
  )
}

function NextStatusButton({ order, onStatusChange }) {
  const NEXT = {
    pending:   { label: 'Accept',   cls: 'btn-primary btn-sm', next: 'accepted' },
    accepted:  { label: 'Start',    cls: 'btn-accent btn-sm',  next: 'preparing' },
    preparing: { label: 'Ready',    cls: 'btn-success btn-sm', next: 'ready' },
    ready:     { label: 'Collect',  cls: 'btn-secondary btn-sm',next: 'collected' },
  }
  const config = NEXT[order.status]
  if (!config) return null

  return (
    <button
      className={config.cls}
      onClick={() => onStatusChange(order._id, config.next)}
    >
      {config.label}
    </button>
  )
}

function TimeAgo({ date }) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000)
  if (seconds < 60)   return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return `${Math.floor(seconds / 3600)}h ago`
}

function OrderTableSkeleton() {
  return (
    <div className="table-container">
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="skeleton h-5 w-20" />
            <div className="skeleton h-5 w-32" />
            <div className="skeleton h-5 w-40" />
            <div className="skeleton h-5 w-16" />
            <div className="skeleton h-5 w-20" />
            <div className="skeleton h-5 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}

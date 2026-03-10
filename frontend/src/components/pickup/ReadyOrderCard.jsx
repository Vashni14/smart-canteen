import { formatCurrency, formatTime, timeAgo } from '@utils/index'

export default function ReadyOrderCard({ order, onCollect, onScan, collecting }) {
  const orderNum = order.orderNumber || order._id?.slice(-6).toUpperCase()
  const waitMins = Math.floor((Date.now() - new Date(order.updatedAt || order.createdAt)) / 60_000)

  return (
    <div className={`
      card overflow-hidden animate-slide-up transition-all duration-300
      order-card-ready
      ${waitMins >= 10 ? 'ring-2 ring-canteen-warning/40' : ''}
    `}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-green-50 border-b border-green-100">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-secondary text-sm">#{orderNum}</span>
          <span className="status-ready">Ready</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-canteen-muted">
          <span>⏳ {waitMins}m waiting</span>
          {waitMins >= 10 && (
            <span className="badge bg-canteen-warning/15 text-canteen-warning font-bold">
              Long wait
            </span>
          )}
        </div>
      </div>

      {/* Customer info */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display font-bold text-secondary text-base">
              {order.userId?.name || 'Customer'}
            </p>
            <p className="text-xs text-canteen-muted mt-0.5">
              Ordered at {formatTime(order.createdAt)} · {timeAgo(order.createdAt)}
            </p>
          </div>
          <div className="text-right">
            <p className="price-text">{formatCurrency(order.totalPrice)}</p>
            <p className="text-xs text-canteen-muted">{order.items?.length} item(s)</p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="px-5 pb-3 space-y-1.5">
        <div className="divider-sm" />
        {order.items?.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
              {item.qty}
            </span>
            <span className="text-sm text-secondary font-semibold flex-1">{item.name}</span>
            {item.note && (
              <span className="text-xs text-canteen-warning italic truncate max-w-[120px]">
                📝 {item.note}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="px-5 pb-4 flex gap-2 pt-1">
        <button
          onClick={() => onScan(order)}
          className="btn-outline flex-1 gap-2"
        >
          📷 Scan QR
        </button>
        <button
          onClick={() => onCollect(order._id)}
          disabled={collecting === order._id}
          className="btn-success flex-1 gap-2"
        >
          {collecting === order._id ? (
            <><Spinner /> Processing…</>
          ) : (
            <>✅ Mark Collected</>
          )}
        </button>
      </div>
    </div>
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

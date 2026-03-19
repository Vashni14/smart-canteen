import { STATUS_CONFIG } from '@utils/index'

const STEPS = [
  { key: 'pending',   label: 'Placed',     icon: '📋' },
  { key: 'accepted',  label: 'Accepted',   icon: '✅' },
  { key: 'preparing', label: 'Preparing',  icon: '👨‍🍳' },
  { key: 'ready',     label: 'Ready',      icon: '🛎️' },
  { key: 'collected', label: 'Collected',  icon: '🎉' },
]

export default function OrderStatusTracker({ status, estimatedTime, cancelReason, cancelledBy }) {
  const isCancelled  = status === 'cancelled'
  const currentStep  = STATUS_CONFIG[status]?.step ?? 0

  if (isCancelled) {
    const byKitchen = cancelledBy === 'chef'
    return (
      <div className="card card-body text-center py-8 animate-fade-in space-y-3">
        <span className="text-4xl block">❌</span>
        <p className="font-display font-bold text-canteen-danger text-lg">Order Cancelled</p>
        {cancelReason ? (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-left">
            <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">
              {byKitchen ? '👨‍🍳 Reason from kitchen' : 'Reason'}
            </p>
            <p className="text-sm text-red-800 font-medium">"{cancelReason}"</p>
          </div>
        ) : (
          <p className="text-sm text-canteen-muted">This order has been cancelled.</p>
        )}
      </div>
    )
  }

  return (
    <div className="card card-body animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="card-title">Order Status</p>
          {estimatedTime && status !== 'collected' && (
            <p className="text-xs text-canteen-muted mt-0.5">
              Est. ready in <span className="font-bold text-primary">{estimatedTime} min</span>
            </p>
          )}
        </div>
        <span className={`status-${status}`}>
          {STATUS_CONFIG[status]?.label}
        </span>
      </div>

      {/* Steps */}
      <div className="relative flex items-start justify-between">
        {/* Progress bar background */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-canteen-border" />

        {/* Progress bar fill */}
        <div
          className="absolute top-4 left-0 h-0.5 bg-canteen-success transition-all duration-700 ease-spring"
          style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step, index) => {
          const isDone   = index < currentStep
          const isActive = index === currentStep

          return (
            <div key={step.key} className="flex flex-col items-center gap-2 flex-1 relative z-10">
              {/* Dot */}
              <div className={`
                w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm
                transition-all duration-500
                ${isDone   ? 'bg-canteen-success border-canteen-success text-white' : ''}
                ${isActive ? 'bg-primary border-primary text-white shadow-primary animate-pulse-soft' : ''}
                ${!isDone && !isActive ? 'bg-white border-canteen-border text-canteen-muted' : ''}
              `}>
                {isDone ? '✓' : step.icon}
              </div>

              {/* Label */}
              <span className={`
                text-xs font-semibold text-center leading-tight
                ${isActive ? 'text-primary' : isDone ? 'text-canteen-success' : 'text-canteen-muted'}
              `}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Status message */}
      <div className="mt-6 p-3 rounded-xl bg-canteen-bg text-center">
        <StatusMessage status={status} />
      </div>
    </div>
  )
}

function StatusMessage({ status }) {
  const messages = {
    pending:   { text: "Your order is queued — kitchen will accept it shortly.",  color: 'text-yellow-600' },
    accepted:  { text: "Order accepted! The kitchen is about to start preparing.", color: 'text-canteen-info' },
    preparing: { text: "Your food is being freshly prepared. Hang tight! 🔥",      color: 'text-primary' },
    ready:     { text: "Your order is ready for pickup! Head to the counter. 🛎️",  color: 'text-canteen-success' },
    collected: { text: "Enjoy your meal! Thanks for ordering. 😊",                 color: 'text-canteen-success' },
  }
  const m = messages[status] || { text: 'Processing your order…', color: 'text-canteen-muted' }
  return <p className={`text-sm font-semibold ${m.color}`}>{m.text}</p>
}
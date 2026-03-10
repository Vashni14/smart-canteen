export default function KitchenStatsBar({ orders }) {
  const counts = {
    pending:   orders.filter(o => o.status === 'pending').length,
    accepted:  orders.filter(o => o.status === 'accepted').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready:     orders.filter(o => o.status === 'ready').length,
  }

  const avgWait = (() => {
    const active = orders.filter(o =>
      ['pending', 'accepted', 'preparing'].includes(o.status)
    )
    if (!active.length) return 0
    const total = active.reduce((sum, o) =>
      sum + Math.floor((Date.now() - new Date(o.createdAt)) / 60_000), 0)
    return Math.round(total / active.length)
  })()

  const stats = [
    { label: 'New Orders',  value: counts.pending,   icon: '🆕', color: 'bg-blue-50 text-blue-700',    ring: counts.pending   > 0 ? 'ring-2 ring-blue-300' : '' },
    { label: 'Accepted',    value: counts.accepted,  icon: '✅', color: 'bg-indigo-50 text-indigo-700', ring: '' },
    { label: 'Preparing',   value: counts.preparing, icon: '🔥', color: 'bg-orange-50 text-orange-700', ring: '' },
    { label: 'Ready',       value: counts.ready,     icon: '🛎️', color: 'bg-green-50 text-green-700',  ring: '' },
    { label: 'Avg Wait',    value: `${avgWait}m`,    icon: '⏱',  color: 'bg-canteen-bg text-secondary', ring: '' },
  ]

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
      {stats.map(s => (
        <div key={s.label}
          className={`card card-body py-3 px-4 flex items-center gap-3 ${s.ring} transition-all`}>
          <span className="text-xl">{s.icon}</span>
          <div>
            <p className={`text-xl font-display font-bold leading-none ${s.color.split(' ')[1]}`}>
              {s.value}
            </p>
            <p className="text-xs text-canteen-muted mt-0.5">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

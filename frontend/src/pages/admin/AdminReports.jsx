import { useState, useEffect } from 'react'
import { adminService } from '@services/index'
import LoadingSkeleton from '@components/common/LoadingSkeleton'
import { formatCurrency, formatDate } from '@utils/index'
import toast from 'react-hot-toast'

const DATE_RANGES = [
  { label: 'Today',      value: 'today' },
  { label: 'Last 7 days',value: '7days' },
  { label: 'Last 30 days',value:'30days' },
  { label: 'This month', value: 'month' },
]

export default function AdminReports() {
  const [range,   setRange]   = useState('7days')
  const [data,    setData]    = useState(null)
  const [loading, setLoad]    = useState(true)

  const fetchReport = async () => {
    setLoad(true)
    try {
      const res = await adminService.getReports({ range })
      setData(res.data)
    } catch {
      toast.error('Failed to load reports')
      // Fallback mock data so UI renders during development
      setData(MOCK_DATA)
    } finally { setLoad(false) }
  }

  useEffect(() => { fetchReport() }, [range])

  if (loading) return <LoadingSkeleton variant="dashboard" />
  if (!data)   return null

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header + range selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Reports & Analytics</h2>
          <p className="section-subtitle">Performance overview for your canteen</p>
        </div>
        <div className="tab-list p-1">
          {DATE_RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={r.value === range ? 'tab-btn-active' : 'tab-btn'}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders',   value: data.totalOrders,                        icon: '📋', bg: 'bg-primary/10',           val: data.totalOrders },
          { label: 'Total Revenue',  value: formatCurrency(data.totalRevenue || 0),  icon: '💰', bg: 'bg-canteen-success/10',   val: null },
          { label: 'Avg Order Value',value: formatCurrency(data.avgOrderValue || 0), icon: '📊', bg: 'bg-blue-100',             val: null },
          { label: 'Cancelled',      value: data.cancelledOrders,                    icon: '❌', bg: 'bg-canteen-danger/10',    val: data.cancelledOrders },
        ].map((s, i) => (
          <div key={s.label} className="stat-card animate-slide-up" style={{ animationDelay: `${i*70}ms` }}>
            <div className={`stat-icon ${s.bg}`}>{s.icon}</div>
            <div>
              <p className="stat-label">{s.label}</p>
              <p className="stat-value">{s.value ?? '—'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart + order status breakdown */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Revenue bar chart */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h3 className="card-title">Revenue Over Time</h3>
            <span className="text-sm text-canteen-muted font-semibold">
              {formatCurrency(data.totalRevenue || 0)} total
            </span>
          </div>
          <div className="card-body">
            <RevenueChart data={data.revenueByDay || []} />
          </div>
        </div>

        {/* Order status donut */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Order Status</h3>
          </div>
          <div className="card-body space-y-3">
            <StatusBreakdown data={data.statusBreakdown || {}} total={data.totalOrders || 0} />
          </div>
        </div>
      </div>

      {/* Top items + Peak hours */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Top selling items */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🏆 Top Selling Items</h3>
          </div>
          <div className="card-body space-y-3">
            {(data.topItems || []).length === 0 ? (
              <p className="text-canteen-muted text-sm text-center py-4">No data yet</p>
            ) : (data.topItems || []).map((item, i) => (
              <TopItemRow key={item.name} item={item} rank={i + 1} max={data.topItems[0]?.count || 1} />
            ))}
          </div>
        </div>

        {/* Peak order hours */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">⏰ Peak Order Hours</h3>
          </div>
          <div className="card-body">
            <PeakHoursChart data={data.peakHours || []} />
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      {data.categoryBreakdown && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Orders by Category</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(data.categoryBreakdown).map(([cat, count]) => (
                <div key={cat} className="text-center p-3 bg-canteen-bg rounded-xl">
                  <p className="text-lg font-display font-bold text-secondary">{count}</p>
                  <p className="text-xs text-canteen-muted mt-0.5">{cat}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────── */

function RevenueChart({ data }) {
  if (!data.length) return <p className="text-canteen-muted text-sm text-center py-8">No revenue data</p>
  const max = Math.max(...data.map(d => d.revenue), 1)

  return (
    <div className="flex items-end gap-1.5 h-48 pt-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
          {/* Tooltip */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-secondary text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap pointer-events-none">
            {formatCurrency(d.revenue)}
          </div>
          {/* Bar */}
          <div
            className="w-full rounded-t-lg bg-primary transition-all duration-500 hover:bg-primary-600 min-h-[4px]"
            style={{ height: `${Math.max((d.revenue / max) * 160, 4)}px` }}
          />
          {/* Label */}
          <span className="text-[10px] text-canteen-muted font-semibold truncate w-full text-center">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  )
}

function StatusBreakdown({ data, total }) {
  const STATUS_COLORS = {
    collected: 'bg-canteen-success',
    pending:   'bg-yellow-400',
    preparing: 'bg-primary',
    ready:     'bg-blue-400',
    cancelled: 'bg-canteen-danger',
  }
  return (
    <>
      {Object.entries(data).map(([status, count]) => {
        const pct = total ? Math.round((count / total) * 100) : 0
        return (
          <div key={status} className="space-y-1">
            <div className="flex justify-between text-xs font-semibold capitalize">
              <span className="text-secondary">{status}</span>
              <span className="text-canteen-muted">{count} ({pct}%)</span>
            </div>
            <div className="h-2 bg-canteen-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${STATUS_COLORS[status] || 'bg-canteen-muted'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </>
  )
}

function TopItemRow({ item, rank, max }) {
  const pct = Math.round((item.count / max) * 100)
  const RANK_ICONS = { 1: '🥇', 2: '🥈', 3: '🥉' }
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span>{RANK_ICONS[rank] || `#${rank}`}</span>
          <span className="font-semibold text-secondary">{item.name}</span>
        </div>
        <span className="text-canteen-muted">{item.count} orders</span>
      </div>
      <div className="h-1.5 bg-canteen-border rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function PeakHoursChart({ data }) {
  if (!data.length) return <p className="text-canteen-muted text-sm text-center py-8">No data</p>
  const max = Math.max(...data.map(d => d.orders), 1)
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-secondary text-white text-xs rounded px-1.5 py-0.5 whitespace-nowrap pointer-events-none">
            {d.orders}
          </div>
          <div
            className="w-full rounded-t bg-secondary/70 hover:bg-secondary transition-all min-h-[3px]"
            style={{ height: `${Math.max((d.orders / max) * 96, 3)}px` }}
          />
          <span className="text-[9px] text-canteen-muted">{d.hour}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Mock data for development (before backend) ─────────── */
const MOCK_DATA = {
  totalOrders: 142, totalRevenue: 18650, avgOrderValue: 131, cancelledOrders: 8,
  revenueByDay: [
    { label: 'Mon', revenue: 2100 }, { label: 'Tue', revenue: 2800 },
    { label: 'Wed', revenue: 1950 }, { label: 'Thu', revenue: 3200 },
    { label: 'Fri', revenue: 3800 }, { label: 'Sat', revenue: 2600 },
    { label: 'Sun', revenue: 2200 },
  ],
  statusBreakdown: { collected: 118, cancelled: 8, preparing: 6, pending: 4, ready: 6 },
  topItems: [
    { name: 'Masala Dosa',   count: 48 },
    { name: 'Veg Biryani',   count: 35 },
    { name: 'Samosa (2pcs)', count: 29 },
    { name: 'Chai',          count: 26 },
    { name: 'Paneer Roll',   count: 21 },
  ],
  peakHours: [
    { hour: '8am', orders: 12 }, { hour: '9am', orders: 28 },
    { hour: '10am', orders: 18 }, { hour: '11am', orders: 9 },
    { hour: '12pm', orders: 42 }, { hour: '1pm', orders: 38 },
    { hour: '2pm', orders: 15 }, { hour: '3pm', orders: 22 },
    { hour: '4pm', orders: 31 }, { hour: '5pm', orders: 19 },
  ],
  categoryBreakdown: { Breakfast: 34, Snacks: 48, Lunch: 82, Beverages: 56, Desserts: 12, Dinner: 24 },
}

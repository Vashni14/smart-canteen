import { useState, useEffect } from 'react'
import { adminService } from '@services/index'
import LoadingSkeleton from '@components/common/LoadingSkeleton'
import { formatCurrency } from '@utils/index'
import toast from 'react-hot-toast'

const DATE_RANGES = [
  { label: 'Today',       value: 'today'  },
  { label: 'Last 7 days', value: '7days'  },
  { label: 'Last 30 days',value: '30days' },
  { label: 'This month',  value: 'month'  },
]

export default function AdminReports() {
  const [range,   setRange]  = useState('7days')
  const [data,    setData]   = useState(null)
  const [loading, setLoad]   = useState(true)
  const [error,   setError]  = useState('')

  const fetchReport = async () => {
    setLoad(true)
    setError('')
    try {
      const res = await adminService.getReports({ range })
      setData(res.data || res.data?.data || null)
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to load reports'
      setError(msg)
      toast.error(msg)
      setData(null)
    } finally { setLoad(false) }
  }

  useEffect(() => { fetchReport() }, [range])

  if (loading) return <LoadingSkeleton variant="dashboard" />

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <span className="text-5xl">📊</span>
        <p className="text-canteen-danger font-semibold">{error || 'No data available'}</p>
        <button onClick={fetchReport} className="btn-primary">Try Again</button>
      </div>
    )
  }

  const totalOrders     = data.totalOrders     || 0
  const totalRevenue    = data.totalRevenue     || 0
  const avgOrderValue   = data.avgOrderValue    || 0
  const cancelledOrders = data.cancelledOrders  || 0
  const revenueByDay    = data.revenueByDay     || []
  const topItems        = data.topItems         || []
  const statusBreakdown = data.statusBreakdown  || {}
  const peakHours       = data.peakHours        || []
  const categoryBreakdown = data.categoryBreakdown || null

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header + date range */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Reports & Analytics</h2>
          <p className="section-subtitle">Performance overview for your canteen</p>
        </div>
        <div className="flex gap-1 p-1 bg-canteen-bg rounded-xl">
          {DATE_RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={r.value === range
                ? 'px-4 py-2 rounded-lg text-sm font-semibold bg-white text-secondary shadow-card'
                : 'px-4 py-2 rounded-lg text-sm font-semibold text-canteen-muted hover:text-secondary'
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders',    value: totalOrders,                  icon: '📋', color: 'bg-primary/10'          },
          { label: 'Total Revenue',   value: formatCurrency(totalRevenue), icon: '💰', color: 'bg-green-100'           },
          { label: 'Avg Order Value', value: formatCurrency(avgOrderValue),icon: '📊', color: 'bg-blue-100'            },
          { label: 'Cancelled',       value: cancelledOrders,              icon: '❌', color: 'bg-red-100'             },
        ].map((s, i) => (
          <div key={s.label} className="bg-white rounded-2xl border border-canteen-border p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <p className="text-xs font-semibold text-canteen-muted uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-bold text-secondary leading-none mt-0.5">{s.value ?? '—'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart + Status breakdown */}
      <div className="grid lg:grid-cols-3 gap-5">

        <div className="lg:col-span-2 bg-white rounded-2xl border border-canteen-border">
          <div className="px-5 py-4 border-b border-canteen-border flex items-center justify-between">
            <h3 className="font-bold text-secondary">Revenue Over Time</h3>
            <span className="text-sm text-canteen-muted font-semibold">{formatCurrency(totalRevenue)} total</span>
          </div>
          <div className="p-5">
            <RevenueChart data={revenueByDay} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-canteen-border">
          <div className="px-5 py-4 border-b border-canteen-border">
            <h3 className="font-bold text-secondary">Order Status</h3>
          </div>
          <div className="p-5 space-y-3">
            <StatusBreakdown data={statusBreakdown} total={totalOrders} />
          </div>
        </div>
      </div>

      {/* Top items + Peak hours */}
      <div className="grid lg:grid-cols-2 gap-5">

        <div className="bg-white rounded-2xl border border-canteen-border">
          <div className="px-5 py-4 border-b border-canteen-border">
            <h3 className="font-bold text-secondary">🏆 Top Selling Items</h3>
          </div>
          <div className="p-5 space-y-3">
            {topItems.length === 0
              ? <p className="text-canteen-muted text-sm text-center py-4">No orders in this period</p>
              : topItems.map((item, i) => (
                  <TopItemRow key={item.name || i} item={item} rank={i + 1} max={topItems[0]?.count || 1} />
                ))
            }
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-canteen-border">
          <div className="px-5 py-4 border-b border-canteen-border">
            <h3 className="font-bold text-secondary">⏰ Peak Order Hours</h3>
          </div>
          <div className="p-5">
            <PeakHoursChart data={peakHours} />
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      {categoryBreakdown && Object.keys(categoryBreakdown).length > 0 && (
        <div className="bg-white rounded-2xl border border-canteen-border">
          <div className="px-5 py-4 border-b border-canteen-border">
            <h3 className="font-bold text-secondary">Orders by Category</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(categoryBreakdown).map(([cat, count]) => (
                <div key={cat} className="text-center p-3 bg-canteen-bg rounded-xl">
                  <p className="text-lg font-bold text-secondary">{count}</p>
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

/* ── Sub-components ───────────────────────────────────────────── */

function RevenueChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-canteen-muted text-sm text-center py-8">No revenue data for this period</p>
  }
  const max = Math.max(...data.map(d => d.revenue || 0), 1)
  return (
    <div className="flex items-end gap-1.5 h-48 pt-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-secondary text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap pointer-events-none">
            {formatCurrency(d.revenue || 0)}
          </div>
          <div
            className="w-full rounded-t-lg bg-primary hover:bg-primary/80 transition-all duration-500 min-h-[4px]"
            style={{ height: `${Math.max(((d.revenue || 0) / max) * 160, 4)}px` }}
          />
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
    collected: 'bg-green-500',
    pending:   'bg-yellow-400',
    accepted:  'bg-blue-400',
    preparing: 'bg-orange-400',
    ready:     'bg-teal-400',
    cancelled: 'bg-red-400',
  }
  const entries = Object.entries(data)
  if (entries.length === 0) {
    return <p className="text-canteen-muted text-sm text-center py-4">No orders in this period</p>
  }
  return (
    <>
      {entries.map(([status, count]) => {
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
  const pct = max ? Math.round(((item.count || 0) / max) * 100) : 0
  const RANK_ICONS = { 1: '🥇', 2: '🥈', 3: '🥉' }
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span>{RANK_ICONS[rank] || `#${rank}`}</span>
          <span className="font-semibold text-secondary">{item.name}</span>
        </div>
        <span className="text-canteen-muted text-xs">{item.count} sold</span>
      </div>
      <div className="h-1.5 bg-canteen-border rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function PeakHoursChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-canteen-muted text-sm text-center py-8">No data for this period</p>
  }
  const max = Math.max(...data.map(d => d.orders || 0), 1)
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-secondary text-white text-xs rounded px-1.5 py-0.5 whitespace-nowrap pointer-events-none">
            {d.orders}
          </div>
          <div
            className="w-full rounded-t bg-secondary/70 hover:bg-secondary transition-all min-h-[3px]"
            style={{ height: `${Math.max(((d.orders || 0) / max) * 96, 3)}px` }}
          />
          <span className="text-[9px] text-canteen-muted">{d.hour}</span>
        </div>
      ))}
    </div>
  )
}
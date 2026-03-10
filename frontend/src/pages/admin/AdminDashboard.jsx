import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminService, orderService } from '@services/index'
import { useSocket } from '@context/SocketContext'
import DashboardCard from '@components/common/DashboardCard'
import OrderTable from '@components/common/OrderTable'
import LoadingSkeleton from '@components/common/LoadingSkeleton'
import { formatCurrency, formatTime, getStatusClass } from '@utils/index'
import { useInterval } from '@hooks/useHelpers'

export default function AdminDashboard() {
  const { on, off }         = useSocket()
  const [stats,   setStats] = useState(null)
  const [orders,  setOrders]= useState([])
  const [loading, setLoad]  = useState(true)

  const fetchAll = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        adminService.getStats(),
        orderService.getKitchen(),
      ])
      setStats(statsRes.data)
      setOrders((ordersRes.data?.orders || ordersRes.data || []).slice(0, 8))
    } catch {}
    finally { setLoad(false) }
  }

  useEffect(() => { fetchAll() }, [])
  useInterval(fetchAll, 60_000)

  // Live order count bump
  useEffect(() => {
    const handler = () => setStats(s => s ? { ...s, todayOrders: (s.todayOrders || 0) + 1 } : s)
    on('order:new', handler)
    return () => off('order:new', handler)
  }, [on, off])

  if (loading) return <LoadingSkeleton variant="dashboard" />

  const STAT_CARDS = [
    {
      title:   "Today's Orders",
      value:   stats?.todayOrders ?? '—',
      icon:    '📋',
      iconBg:  'bg-primary/10',
      trend:   stats?.ordersTrend,
      trendUp: (stats?.ordersTrend ?? 0) >= 0,
    },
    {
      title:   "Today's Revenue",
      value:   stats?.todayRevenue != null ? formatCurrency(stats.todayRevenue) : '—',
      icon:    '💰',
      iconBg:  'bg-canteen-success/10',
      trend:   stats?.revenueTrend,
      trendUp: (stats?.revenueTrend ?? 0) >= 0,
    },
    {
      title:   'Active Orders',
      value:   stats?.activeOrders ?? '—',
      icon:    '🔴',
      iconBg:  'bg-blue-100',
      subtitle:'Currently being prepared',
    },
    {
      title:   'Menu Items',
      value:   stats?.menuItems ?? '—',
      icon:    '🍽️',
      iconBg:  'bg-accent/20',
      subtitle:`${stats?.unavailableItems ?? 0} unavailable`,
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Page header */}
      <div>
        <h2 className="section-title">Dashboard Overview</h2>
        <p className="section-subtitle">Welcome back — here's what's happening today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card, i) => (
          <div key={card.title} className="animate-slide-up" style={{ animationDelay: `${i * 70}ms` }}>
            <DashboardCard {...card} />
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/admin/menu',      icon: '🍔', label: 'Manage Menu',      color: 'bg-primary/10 text-primary' },
          { to: '/admin/orders',    icon: '📋', label: 'View All Orders',  color: 'bg-blue-100 text-blue-700' },
          { to: '/admin/inventory', icon: '🏪', label: 'Inventory',        color: 'bg-canteen-success/10 text-canteen-success' },
          { to: '/admin/reports',   icon: '📈', label: 'Reports',          color: 'bg-accent/20 text-secondary' },
        ].map(q => (
          <Link key={q.to} to={q.to}
            className={`card card-body flex items-center gap-3 hover:shadow-card-hover transition-shadow ${q.color}`}>
            <span className="text-xl">{q.icon}</span>
            <span className="font-semibold text-sm">{q.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-secondary">Recent Orders</h3>
          <Link to="/admin/orders" className="text-sm text-primary font-semibold hover:underline">
            View all →
          </Link>
        </div>
        <OrderTable
          orders={orders}
          loading={false}
          onView={() => {}}
        />
      </div>

      {/* Low stock alert */}
      {stats?.lowStockItems?.length > 0 && (
        <div className="alert-warning animate-fade-in">
          <span className="text-xl">⚠️</span>
          <div className="flex-1">
            <p className="font-bold">Low Stock Alert</p>
            <p className="text-sm">
              {stats.lowStockItems.join(', ')} {stats.lowStockItems.length === 1 ? 'is' : 'are'} running low.
            </p>
          </div>
          <Link to="/admin/inventory" className="btn-warning btn-sm flex-shrink-0 btn bg-canteen-warning text-white">
            Fix Now
          </Link>
        </div>
      )}

    </div>
  )
}

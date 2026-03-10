import { useState, useEffect, useCallback } from 'react'
import { orderService } from '@services/index'
import { useSocket } from '@context/SocketContext'
import { useDebounce, useInterval } from '@hooks/useHelpers'
import OrderTable from '@components/common/OrderTable'
import LoadingSkeleton from '@components/common/LoadingSkeleton'
import Modal from '@components/common/Modal'
import SearchBar from '@components/common/SearchBar'
import { formatCurrency, formatDate, getStatusClass, ORDER_STATUSES } from '@utils/index'
import toast from 'react-hot-toast'

const STATUS_TABS = ['all', 'pending', 'accepted', 'preparing', 'ready', 'collected', 'cancelled']

export default function AdminOrders() {
  const { on, off }         = useSocket()
  const [orders,  setOrders]= useState([])
  const [loading, setLoad]  = useState(true)
  const [search,  setSearch]= useState('')
  const [tab,     setTab]   = useState('all')
  const [detail,  setDetail]= useState(null)
  const dSearch             = useDebounce(search, 350)

  const fetchOrders = useCallback(async () => {
    try {
      const res = await orderService.getKitchen()
      setOrders(res.data?.orders || res.data || [])
    } catch { toast.error('Failed to load orders') }
    finally { setLoad(false) }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])
  useInterval(fetchOrders, 45_000)

  // Live updates
  useEffect(() => {
    const onNew     = (o) => setOrders(p => [o, ...p])
    const onUpdate  = (o) => setOrders(p => p.map(x => x._id === o._id ? { ...x, ...o } : x))
    on('order:new',            onNew)
    on('order:status-updated', onUpdate)
    return () => { off('order:new', onNew); off('order:status-updated', onUpdate) }
  }, [on, off])

  /* ── Filter ─────────────────────────────────────────── */
  const filtered = orders.filter(o => {
    const matchTab    = tab === 'all' || o.status === tab
    const matchSearch = !dSearch ||
      o.userId?.name?.toLowerCase().includes(dSearch.toLowerCase()) ||
      o._id?.toLowerCase().includes(dSearch.toLowerCase()) ||
      o.orderNumber?.toLowerCase().includes(dSearch.toLowerCase())
    return matchTab && matchSearch
  })

  /* ── Status change ───────────────────────────────────── */
  const handleStatusChange = async (orderId, newStatus) => {
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o))
    try {
      await orderService.updateStatus(orderId, newStatus)
      toast.success(`Order status → ${newStatus}`)
    } catch {
      fetchOrders()
      toast.error('Status update failed')
    }
  }

  /* ── Tab counts ──────────────────────────────────────── */
  const count = (s) => s === 'all' ? orders.length : orders.filter(o => o.status === s).length

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Order Monitoring</h2>
          <p className="section-subtitle">{orders.length} total orders</p>
        </div>
        <button onClick={fetchOrders} className="btn-ghost btn-sm gap-1">🔄 Refresh</button>
      </div>

      {/* Search */}
      <SearchBar value={search} onChange={setSearch} placeholder="Search by name or order ID…" />

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {STATUS_TABS.map(s => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize
              ${tab === s ? 'bg-secondary text-white' : 'bg-white border border-canteen-border text-canteen-muted hover:border-secondary/50'}`}
          >
            {s} <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold
              ${tab === s ? 'bg-white/20 text-white' : 'bg-canteen-border text-secondary'}`}>
              {count(s)}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton variant="table" rows={8} />
      ) : (
        <OrderTable
          orders={filtered}
          onStatusChange={handleStatusChange}
          onView={setDetail}
        />
      )}

      {/* Order detail modal */}
      <Modal
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        title={`Order #${detail?.orderNumber || detail?._id?.slice(-6).toUpperCase()}`}
        size="md"
      >
        {detail && <OrderDetailView order={detail} onStatusChange={handleStatusChange} onClose={() => setDetail(null)} />}
      </Modal>

    </div>
  )
}

function OrderDetailView({ order, onStatusChange, onClose }) {
  const [saving, setSaving] = useState(false)
  const orderNum = order.orderNumber || order._id?.slice(-6).toUpperCase()

  const handleStatus = async (newStatus) => {
    setSaving(true)
    await onStatusChange(order._id, newStatus)
    setSaving(false)
    onClose()
  }

  const NEXT = { pending:'accepted', accepted:'preparing', preparing:'ready', ready:'collected' }
  const nextStatus = NEXT[order.status]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        {[
          ['Order #',   `#${orderNum}`],
          ['Status',    <span className={getStatusClass(order.status)}>{order.status}</span>],
          ['Customer',  order.userId?.name || '—'],
          ['Email',     order.userId?.email || '—'],
          ['Placed at', formatDate(order.createdAt)],
          ['Payment',   order.paymentMethod || 'upi'],
        ].map(([label, val]) => (
          <div key={label}>
            <p className="label-text">{label}</p>
            <p className="font-semibold text-secondary mt-0.5">{val}</p>
          </div>
        ))}
      </div>

      <div className="divider" />

      <div className="space-y-2">
        <p className="label-text">Items Ordered</p>
        {order.items?.map((item, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 border-b border-canteen-border last:border-0">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{item.qty}</span>
              <div>
                <p className="text-sm font-semibold text-secondary">{item.name}</p>
                {item.note && <p className="text-xs text-canteen-muted italic">"{item.note}"</p>}
              </div>
            </div>
            <span className="text-sm font-semibold text-secondary">{formatCurrency(item.price * item.qty)}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-1 font-display font-bold text-secondary">
        <span>Total</span>
        <span className="text-primary">{formatCurrency(order.totalPrice)}</span>
      </div>

      {order.notes && (
        <div className="p-3 bg-accent/10 rounded-xl border border-accent/20">
          <p className="label-text mb-1">Order Note</p>
          <p className="text-sm text-secondary">"{order.notes}"</p>
        </div>
      )}

      {nextStatus && (
        <div className="divider" />
      )}

      {nextStatus && (
        <button
          onClick={() => handleStatus(nextStatus)}
          disabled={saving}
          className="btn-primary w-full capitalize"
        >
          {saving ? 'Updating…' : `Move to → ${nextStatus}`}
        </button>
      )}
    </div>
  )
}

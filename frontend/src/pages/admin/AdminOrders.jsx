import { useState, useEffect, useCallback } from 'react'
import { orderService } from '@services/index'
import { useSocket } from '@context/SocketContext'
import { useDebounce, useInterval } from '@hooks/useHelpers'
import Modal from '@components/common/Modal'
import SearchBar from '@components/common/SearchBar'
import LoadingSkeleton from '@components/common/LoadingSkeleton'
import { formatCurrency, formatDate, formatTime } from '@utils/index'
import toast from 'react-hot-toast'

const STATUS_TABS = ['all','pending','accepted','preparing','ready','collected','cancelled']

const STATUS_STYLE = {
  pending:   'bg-yellow-100 text-yellow-700',
  accepted:  'bg-blue-100 text-blue-700',
  preparing: 'bg-orange-100 text-orange-700',
  ready:     'bg-green-100 text-green-700',
  collected: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
}

const NEXT_STATUS = {
  pending:   ['accepted','cancelled'],
  accepted:  ['preparing','cancelled'],
  preparing: ['ready'],
  ready:     ['collected'],
}

export default function AdminOrders() {
  const { on, off }          = useSocket()
  const [orders,  setOrders] = useState([])
  const [loading, setLoad]   = useState(true)
  const [search,  setSearch] = useState('')
  const [tab,     setTab]    = useState('all')
  const [detail,  setDetail] = useState(null)
  const dSearch              = useDebounce(search, 350)

  const fetchOrders = useCallback(async () => {
    try {
      const res = await orderService.getAll()
      setOrders(res.data?.orders || [])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load orders')
    } finally {
      setLoad(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])
  useInterval(fetchOrders, 45_000)

  // Live socket updates
  useEffect(() => {
    const onNew    = (o) => setOrders(p => [o, ...p])
    const onUpdate = (o) => setOrders(p => p.map(x => x._id === o._id ? { ...x, ...o } : x))
    on('order:new',            onNew)
    on('order:status-updated', onUpdate)
    return () => { off('order:new', onNew); off('order:status-updated', onUpdate) }
  }, [on, off])

  const filtered = orders.filter(o => {
    const matchTab    = tab === 'all' || o.status === tab
    const matchSearch = !dSearch ||
      o.userId?.name?.toLowerCase().includes(dSearch.toLowerCase()) ||
      o.orderNumber?.toLowerCase().includes(dSearch.toLowerCase())
    return matchTab && matchSearch
  })

  const tabCounts = STATUS_TABS.reduce((acc, s) => {
    acc[s] = s === 'all' ? orders.length : orders.filter(o => o.status === s).length
    return acc
  }, {})

  const handleStatusChange = async (orderId, newStatus) => {
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o))
    try {
      await orderService.updateStatus(orderId, newStatus)
      toast.success(`Status → ${newStatus}`)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status')
      fetchOrders()
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">All Orders</h2>
          <p className="section-subtitle">{orders.length} total orders</p>
        </div>
        <button onClick={fetchOrders} className="btn-ghost btn-sm">🔄 Refresh</button>
      </div>

      {/* Search */}
      <SearchBar value={search} onChange={setSearch} placeholder="Search by order number or customer…" />

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map(s => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border ${
              tab === s
                ? 'bg-secondary text-white border-secondary'
                : 'bg-white text-canteen-muted border-canteen-border hover:border-secondary/40'
            }`}
          >
            {s} {tabCounts[s] > 0 && <span className="ml-1 opacity-70">({tabCounts[s]})</span>}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? <LoadingSkeleton variant="table" rows={8} /> : (
        <div className="table-container overflow-x-auto">
          <table className="table-base">
            <thead className="table-thead">
              <tr>
                <th className="table-th">Order</th>
                <th className="table-th">Customer</th>
                <th className="table-th">Items</th>
                <th className="table-th">Total</th>
                <th className="table-th">Status</th>
                <th className="table-th">Date</th>
                <th className="table-th text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="table-td text-center py-10 text-canteen-muted">No orders found</td></tr>
              ) : filtered.map(o => (
                <tr key={o._id} className="table-tr cursor-pointer hover:bg-primary/5" onClick={() => setDetail(o)}>
                  <td className="table-td">
                    <span className="font-mono font-bold text-xs text-secondary">
                      #{o.orderNumber || o._id?.slice(-6).toUpperCase()}
                    </span>
                  </td>
                  <td className="table-td text-sm">{o.userId?.name || '—'}</td>
                  <td className="table-td text-sm text-canteen-muted">{o.items?.length} item(s)</td>
                  <td className="table-td">
                    <span className="price-text text-sm">{formatCurrency(o.totalPrice)}</span>
                  </td>
                  <td className="table-td" onClick={e => e.stopPropagation()}>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${STATUS_STYLE[o.status] || ''}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="table-td text-xs text-canteen-muted">{formatDate(o.createdAt)}</td>
                  <td className="table-td text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1 justify-end flex-wrap">
                      {(NEXT_STATUS[o.status] || []).map(ns => (
                        <button
                          key={ns}
                          onClick={() => handleStatusChange(o._id, ns)}
                          className="btn-xs btn-outline capitalize"
                        >
                          → {ns}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order detail modal */}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={`Order #${detail?.orderNumber || ''}`} size="md">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="card-flat p-3">
                <p className="label-text mb-1">Customer</p>
                <p className="font-semibold text-secondary">{detail.userId?.name}</p>
                <p className="text-canteen-muted text-xs">{detail.userId?.email}</p>
              </div>
              <div className="card-flat p-3">
                <p className="label-text mb-1">Payment</p>
                <p className="font-semibold text-secondary capitalize">{detail.paymentMethod}</p>
                <p className={`text-xs font-bold ${detail.paymentStatus === 'paid' ? 'text-canteen-success' : 'text-canteen-warning'}`}>
                  {detail.paymentStatus}
                </p>
              </div>
              <div className="card-flat p-3">
                <p className="label-text mb-1">Status</p>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${STATUS_STYLE[detail.status]}`}>
                  {detail.status}
                </span>
              </div>
              <div className="card-flat p-3">
                <p className="label-text mb-1">Placed</p>
                <p className="font-semibold text-secondary text-xs">{formatDate(detail.createdAt)}</p>
                <p className="text-canteen-muted text-xs">{formatTime(detail.createdAt)}</p>
              </div>
            </div>

            <div className="card-flat p-4 space-y-2">
              <p className="label-text mb-2">Items</p>
              {detail.items?.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {item.qty}
                    </span>
                    <span className="text-secondary">{item.name}</span>
                    {item.note && <span className="text-xs text-canteen-muted italic">({item.note})</span>}
                  </div>
                  <span className="font-semibold text-secondary">{formatCurrency(item.price * item.qty)}</span>
                </div>
              ))}
              <div className="divider" />
              <div className="flex justify-between font-bold">
                <span className="text-secondary">Total</span>
                <span className="price-text">{formatCurrency(detail.totalPrice)}</span>
              </div>
            </div>

            {/* Status history */}
            {detail.statusHistory?.length > 0 && (
              <div className="card-flat p-4">
                <p className="label-text mb-3">Status History</p>
                <div className="space-y-2">
                  {detail.statusHistory.map((h, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-bold capitalize ${STATUS_STYLE[h.status] || 'bg-gray-100 text-gray-600'}`}>
                        {h.status}
                      </span>
                      <span className="text-canteen-muted">{formatTime(h.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next actions */}
            {(NEXT_STATUS[detail.status] || []).length > 0 && (
              <div className="flex gap-2">
                {(NEXT_STATUS[detail.status] || []).map(ns => (
                  <button
                    key={ns}
                    onClick={() => { handleStatusChange(detail._id, ns); setDetail(d => ({ ...d, status: ns })) }}
                    className="btn-primary flex-1 capitalize"
                  >
                    Move to {ns}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
import { useState, useEffect, useCallback } from 'react'
import { orderService } from '@services/index'
import { useSocket } from '@context/SocketContext'
import { useInterval } from '@hooks/useHelpers'
import ReadyOrderCard from '@components/pickup/ReadyOrderCard'
import QRScanner from '@components/pickup/QRScanner'
import QRVerifyModal from '@components/pickup/QRVerifyModal'
import Modal from '@components/common/Modal'
import LoadingSkeleton from '@components/common/LoadingSkeleton'
import ErrorState from '@components/common/ErrorState'
import { formatCurrency, formatTime } from '@utils/index'
import toast from 'react-hot-toast'

export default function PickupDashboard() {
  const { on, off } = useSocket()

  const [readyOrders,     setReady]      = useState([])
  const [recentCollected, setCollected]  = useState([])
  const [loading,         setLoading]    = useState(true)
  const [error,           setError]      = useState(null)
  const [collecting,      setCollecting] = useState(null)

  const [scanOpen,      setScanOpen]     = useState(false)
  const [scannedOrder,  setScannedOrder] = useState(null)
  const [verifyResult,  setVerifyResult] = useState(null)
  const [verifyOpen,    setVerifyOpen]   = useState(false)
  const [verifyLoading, setVerifyLoad]   = useState(false)

  /* ── Fetch ───────────────────────────────────────────── */
  const fetchOrders = useCallback(async () => {
    try {
      const res  = await orderService.getReady()
      const data = res.data?.orders || res.data || []
      setReady(data)
      setError(null)
    } catch {
      setError('Failed to load ready orders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])
  useInterval(fetchOrders, 30_000)

  /* ── Socket ──────────────────────────────────────────── */
  useEffect(() => {
    const handleReady = (order) => {
      setReady(prev => {
        if (prev.find(o => o._id === order._id)) return prev
        toast('🛎️ New order ready for pickup!', {
          style: { background: '#2ECC71', color: '#fff', fontWeight: '700' },
        })
        return [order, ...prev]
      })
    }
    const handleCollected = ({ orderId, _id }) => {
      const id = orderId || _id
      setReady(prev => {
        const order = prev.find(o => o._id === id)
        if (order) {
          setCollected(c =>
            [{ ...order, status: 'collected', collectedAt: new Date() }, ...c].slice(0, 10)
          )
        }
        return prev.filter(o => o._id !== id)
      })
    }
    const handleCancelled = ({ orderId, _id }) => {
      const id = orderId || _id
      setReady(prev => prev.filter(o => o._id !== id))
    }

    on('order:ready',     handleReady)
    on('order:collected', handleCollected)
    on('order:cancelled', handleCancelled)
    return () => {
      off('order:ready',     handleReady)
      off('order:collected', handleCollected)
      off('order:cancelled', handleCancelled)
    }
  }, [on, off])

  /* ── Collect ─────────────────────────────────────────── */
  const handleCollect = async (orderId) => {
    setCollecting(orderId)
    try {
      await orderService.markCollected(orderId)
      const order = readyOrders.find(o => o._id === orderId)
      setReady(prev => prev.filter(o => o._id !== orderId))
      if (order) {
        setCollected(prev =>
          [{ ...order, status: 'collected', collectedAt: new Date() }, ...prev].slice(0, 10)
        )
      }
      toast.success('Order collected ✅')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to mark collected')
    } finally {
      setCollecting(null)
    }
  }

  /* ── QR flow ─────────────────────────────────────────── */
  const handleOpenScan = (order = null) => {
    setScannedOrder(order)
    setScanOpen(true)
  }

  const handleQRResult = async (qrData) => {
    setScanOpen(false)
    setVerifyLoad(true)

    try {
      // Parse QR — could be JSON {"orderId":"...","orderNumber":"SC0001"}
      // or plain string like "SC0001" or a raw MongoDB ID
      let orderId = null
      let orderNumber = null

      try {
        const parsed = JSON.parse(qrData)
        orderId     = parsed.orderId
        orderNumber = parsed.orderNumber
      } catch {
        // Not JSON — treat as raw value (order number or ID)
        const val = qrData.trim().toUpperCase()
        if (val.startsWith('SC')) {
          orderNumber = val
        } else {
          orderId = qrData.trim()
        }
      }

      // Find order by MongoDB _id OR by orderNumber
      const order = readyOrders.find(o =>
        (orderId     && o._id         === orderId)     ||
        (orderNumber && o.orderNumber === orderNumber) ||
        // also try matching last 6 chars for short IDs typed manually
        o.orderNumber === qrData.trim().toUpperCase()
      )

      const alreadyCollected = recentCollected.find(o =>
        o._id === orderId || o.orderNumber === orderNumber
      )

      if (order) {
        setScannedOrder(order)
        setVerifyResult({ valid: true })
      } else if (alreadyCollected) {
        setScannedOrder(alreadyCollected)
        setVerifyResult({
          valid:            false,
          alreadyCollected: true,
          reason:           'This order has already been collected.',
        })
      } else {
        setScannedOrder({
          _id:         orderId || qrData,
          orderNumber: orderNumber || qrData.toUpperCase(),
          items:       [],
          totalPrice:  0,
          userId:      { name: 'Unknown' },
        })
        setVerifyResult({
          valid:  false,
          reason: 'Order not found in ready list. It may not be ready yet, or was already collected.',
        })
      }
    } catch {
      setVerifyResult({ valid: false, reason: 'Could not read QR code data.' })
    } finally {
      setVerifyLoad(false)
      setVerifyOpen(true)
    }
  }

  const handleVerifyConfirm = async (orderId) => {
    setVerifyLoad(true)
    try {
      await handleCollect(orderId)
      setVerifyOpen(false)
      setScannedOrder(null)
    } finally {
      setVerifyLoad(false)
    }
  }

  /* ── Stats ───────────────────────────────────────────── */
  const longestWait = readyOrders.length
    ? Math.max(...readyOrders.map(o =>
        Math.floor((Date.now() - new Date(o.updatedAt || o.createdAt)) / 60_000)
      ))
    : 0

  if (loading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => <div key={i} className="skeleton h-20" />)}
      </div>
      <LoadingSkeleton variant="order-list" count={3} />
    </div>
  )

  if (error) return <ErrorState title="Pickup Error" message={error} onRetry={fetchOrders} />

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Pickup Counter</h2>
          <p className="section-subtitle">
            {readyOrders.length} order{readyOrders.length !== 1 ? 's' : ''} waiting
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleOpenScan()} className="btn-primary gap-2">
            📷 Scan QR Code
          </button>
          <button onClick={fetchOrders} className="btn-ghost btn-icon" title="Refresh">
            <RefreshIcon />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card">
          <div className="stat-icon bg-canteen-success/10">🛎️</div>
          <div>
            <p className="stat-value">{readyOrders.length}</p>
            <p className="stat-label">Ready Now</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-primary/10">✅</div>
          <div>
            <p className="stat-value">{recentCollected.length}</p>
            <p className="stat-label">Collected</p>
          </div>
        </div>
        <div className="stat-card">
          <div className={`stat-icon ${longestWait >= 10 ? 'bg-canteen-warning/10' : 'bg-canteen-bg'}`}>⏱</div>
          <div>
            <p className={`stat-value ${longestWait >= 10 ? 'text-canteen-warning' : ''}`}>
              {longestWait}m
            </p>
            <p className="stat-label">Longest Wait</p>
          </div>
        </div>
      </div>

      {/* Ready orders */}
      {readyOrders.length === 0 ? (
        <div className="card">
          <div className="empty-state py-16">
            <p className="empty-state-icon">📦</p>
            <p className="empty-state-title">No orders waiting</p>
            <p className="empty-state-desc">
              Ready orders will appear here as the kitchen marks them done.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...readyOrders]
            .sort((a, b) => new Date(a.updatedAt || a.createdAt) - new Date(b.updatedAt || b.createdAt))
            .map((order, i) => (
              <div key={order._id} style={{ animationDelay: `${i * 60}ms` }}>
                <ReadyOrderCard
                  order={order}
                  onCollect={handleCollect}
                  onScan={handleOpenScan}
                  collecting={collecting}
                />
              </div>
            ))
          }
        </div>
      )}

      {/* Recently Collected */}
      {recentCollected.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display font-bold text-secondary text-base flex items-center gap-2">
            ✅ Recently Collected
            <span className="badge-neutral">{recentCollected.length}</span>
          </h3>
          <div className="table-container overflow-x-auto">
            <table className="table-base">
              <thead className="table-thead">
                <tr>
                  <th className="table-th">Order</th>
                  <th className="table-th">Customer</th>
                  <th className="table-th">Items</th>
                  <th className="table-th">Total</th>
                  <th className="table-th">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentCollected.map(order => (
                  <tr key={order._id} className="table-tr opacity-70">
                    <td className="table-td">
                      <span className="font-mono font-bold text-xs">
                        #{order.orderNumber || order._id?.slice(-6).toUpperCase()}
                      </span>
                    </td>
                    <td className="table-td text-sm">{order.userId?.name || '—'}</td>
                    <td className="table-td text-sm">{order.items?.length} item(s)</td>
                    <td className="table-td">
                      <span className="price-text text-sm">{formatCurrency(order.totalPrice)}</span>
                    </td>
                    <td className="table-td text-xs text-canteen-muted">
                      {order.collectedAt ? formatTime(order.collectedAt) : 'Just now'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      <Modal isOpen={scanOpen} onClose={() => setScanOpen(false)} title="Scan Customer QR Code" size="sm">
        <QRScanner onScan={handleQRResult} onClose={() => setScanOpen(false)} />
      </Modal>

      {/* Verify Modal */}
      <QRVerifyModal
        isOpen={verifyOpen}
        order={scannedOrder}
        verifyResult={verifyResult}
        onConfirm={handleVerifyConfirm}
        onClose={() => { setVerifyOpen(false); setScannedOrder(null) }}
        loading={verifyLoading}
      />
    </div>
  )
}

function RefreshIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}
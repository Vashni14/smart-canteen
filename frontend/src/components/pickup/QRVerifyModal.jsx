import { formatCurrency } from '@utils/index'
import Modal from '@components/common/Modal'

export default function QRVerifyModal({ isOpen, order, verifyResult, onConfirm, onClose, loading }) {
  if (!order) return null

  const orderNum = order.orderNumber || order._id?.slice(-6).toUpperCase()
  const isValid  = verifyResult?.valid !== false

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QR Code Verification" size="sm">
      <div className="space-y-4">

        {/* Result banner */}
        <div className={`rounded-2xl p-4 text-center ${
          isValid ? 'bg-canteen-success/10 border-2 border-canteen-success/30'
                  : 'bg-canteen-danger/10 border-2 border-canteen-danger/30'
        }`}>
          <span className="text-4xl block mb-2">{isValid ? '✅' : '❌'}</span>
          <p className={`font-display font-bold text-lg ${isValid ? 'text-canteen-success' : 'text-canteen-danger'}`}>
            {isValid ? 'QR Code Valid' : 'QR Code Invalid'}
          </p>
          {verifyResult?.reason && (
            <p className="text-sm text-canteen-muted mt-1">{verifyResult.reason}</p>
          )}
        </div>

        {/* Order details */}
        <div className="card-flat p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="label-text">Order</span>
            <span className="font-mono font-bold text-secondary">#{orderNum}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="label-text">Customer</span>
            <span className="font-semibold text-secondary text-sm">
              {order.userId?.name || 'Customer'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="label-text">Items</span>
            <span className="font-semibold text-secondary text-sm">{order.items?.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="label-text">Total</span>
            <span className="price-text">{formatCurrency(order.totalPrice)}</span>
          </div>
          <div className="divider-sm" />
          <div className="space-y-1">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {item.qty}
                </span>
                <span className="text-secondary">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Double-scan protection */}
        {verifyResult?.alreadyCollected && (
          <div className="alert-warning text-sm">
            ⚠ This order has already been collected. Do not hand out again.
          </div>
        )}

        {/* Actions */}
        {isValid && !verifyResult?.alreadyCollected ? (
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-ghost flex-1" disabled={loading}>
              Cancel
            </button>
            <button
              onClick={() => onConfirm(order._id)}
              disabled={loading}
              className="btn-success flex-1"
            >
              {loading ? 'Collecting…' : '✅ Confirm Handout'}
            </button>
          </div>
        ) : (
          <button onClick={onClose} className="btn-secondary w-full">
            Close
          </button>
        )}

      </div>
    </Modal>
  )
}

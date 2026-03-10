import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '@context/CartContext'
import { useAuth } from '@context/AuthContext'
import { orderService } from '@services/index'
import { formatCurrency } from '@utils/index'
import toast from 'react-hot-toast'

const PAYMENT_METHODS = [
  { id: 'upi',  label: 'UPI',          icon: '📱', desc: 'Google Pay, PhonePe, Paytm' },
  { id: 'card', label: 'Debit/Credit', icon: '💳', desc: 'Visa, Mastercard, RuPay' },
  { id: 'cash', label: 'Pay at Counter', icon: '💵', desc: 'Pay when collecting your order' },
]

const PAYMENT_STEPS = ['Review', 'Payment', 'Confirm']

export default function CheckoutPage() {
  const { items, totalAmount, clearCart } = useCart()
  const { user }   = useAuth()
  const navigate   = useNavigate()

  const [step, setStep]           = useState(0)
  const [payMethod, setPayMethod] = useState('upi')
  const [orderNote, setOrderNote] = useState('')
  const [loading, setLoading]     = useState(false)
  const [payLoading, setPayLoad]  = useState(false)

  const taxes     = Math.round(totalAmount * 0.05)
  const grandTotal = totalAmount + taxes

  // Redirect if cart empty
  if (items.length === 0) {
    navigate('/menu', { replace: true })
    return null
  }

  /* ── Step 0: Review ─────────────────────────────────── */
  const ReviewStep = () => (
    <div className="space-y-4 animate-slide-in">
      <h2 className="text-lg font-display font-bold text-secondary">Review Your Order</h2>

      <div className="card divide-y divide-canteen-border">
        {items.map(item => (
          <div key={item._id} className="flex items-center gap-3 px-5 py-3">
            <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
              {item.qty}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-secondary text-sm truncate">{item.name}</p>
              {item.note && <p className="text-xs text-canteen-muted italic">"{item.note}"</p>}
            </div>
            <span className="price-text text-sm">{formatCurrency(item.price * item.qty)}</span>
          </div>
        ))}
      </div>

      {/* Order note */}
      <div className="form-group">
        <label className="form-label">Order Note (optional)</label>
        <textarea
          value={orderNote}
          onChange={e => setOrderNote(e.target.value)}
          placeholder="Any special requests for the whole order…"
          rows={2}
          className="form-textarea"
          maxLength={200}
        />
      </div>

      <button onClick={() => setStep(1)} className="btn-primary w-full btn-lg">
        Continue to Payment →
      </button>
    </div>
  )

  /* ── Step 1: Payment ────────────────────────────────── */
  const simulatePayment = async () => {
    setPayLoad(true)
    await new Promise(r => setTimeout(r, 1800)) // simulate gateway
    setPayLoad(false)
    setStep(2)
  }

  const PaymentStep = () => (
    <div className="space-y-4 animate-slide-in">
      <h2 className="text-lg font-display font-bold text-secondary">Payment Method</h2>

      <div className="space-y-2">
        {PAYMENT_METHODS.map(pm => (
          <button
            key={pm.id}
            onClick={() => setPayMethod(pm.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
              ${payMethod === pm.id
                ? 'border-primary bg-primary/5'
                : 'border-canteen-border hover:border-primary/50'}`}
          >
            <span className="text-2xl">{pm.icon}</span>
            <div className="flex-1">
              <p className="font-bold text-secondary text-sm">{pm.label}</p>
              <p className="text-xs text-canteen-muted">{pm.desc}</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
              ${payMethod === pm.id ? 'border-primary' : 'border-canteen-border'}`}>
              {payMethod === pm.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
            </div>
          </button>
        ))}
      </div>

      {/* Amount */}
      <div className="card card-body bg-canteen-bg">
        <div className="flex justify-between font-display font-bold text-secondary text-lg">
          <span>Amount to Pay</span>
          <span className="text-primary">{formatCurrency(grandTotal)}</span>
        </div>
      </div>

      <button
        onClick={simulatePayment}
        disabled={payLoading}
        className="btn-primary w-full btn-lg"
      >
        {payLoading ? (
          <span className="flex items-center gap-2">
            <Spinner />
            {payMethod === 'cash' ? 'Placing order…' : 'Processing payment…'}
          </span>
        ) : (
          payMethod === 'cash'
            ? 'Place Order (Pay at Counter)'
            : `Pay ${formatCurrency(grandTotal)}`
        )}
      </button>

      <button onClick={() => setStep(0)} className="btn-ghost w-full">
        ← Back to Review
      </button>
    </div>
  )

  /* ── Step 2: Confirm / Place ────────────────────────── */
  const placeOrder = async () => {
    setLoading(true)
    try {
      const payload = {
        items: items.map(i => ({
          menuItem: i._id,
          name:     i.name,
          price:    i.price,
          qty:      i.qty,
          note:     i.note || '',
        })),
        totalPrice:    grandTotal,
        paymentMethod: payMethod,
        notes:         orderNote,
      }
      const res = await orderService.create(payload)
      const orderId = res.data?.order?._id || res.data?._id
      clearCart()
      toast.success('Order placed successfully! 🎉')
      navigate(`/orders/${orderId}/track`, { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to place order'
      toast.error(msg)
      // Edge case: payment succeeded but order failed
      if (payMethod !== 'cash') {
        toast.error('Payment was processed. Please contact the canteen counter.')
      }
    } finally {
      setLoading(false)
    }
  }

  const ConfirmStep = () => (
    <div className="space-y-5 animate-slide-in text-center">
      <div className="w-16 h-16 bg-canteen-success/10 rounded-2xl flex items-center justify-center text-3xl mx-auto">
        {payMethod === 'cash' ? '📋' : '✅'}
      </div>
      <div>
        <h2 className="text-xl font-display font-bold text-secondary">
          {payMethod === 'cash' ? 'Order Ready to Place' : 'Payment Successful!'}
        </h2>
        <p className="text-canteen-muted text-sm mt-1">
          {payMethod === 'cash'
            ? 'Your order will be placed and you can pay at the counter.'
            : `₹${grandTotal.toFixed(2)} paid via ${PAYMENT_METHODS.find(p => p.id === payMethod)?.label}`}
        </p>
      </div>

      {/* Summary */}
      <div className="card card-body text-left space-y-2 text-sm">
        <p className="font-bold text-secondary">{items.length} item(s) · {formatCurrency(grandTotal)}</p>
        {items.slice(0, 3).map(i => (
          <p key={i._id} className="text-canteen-muted">{i.name} ×{i.qty}</p>
        ))}
        {items.length > 3 && <p className="text-canteen-muted">…and {items.length - 3} more</p>}
      </div>

      <button
        onClick={placeOrder}
        disabled={loading}
        className="btn-primary w-full btn-lg"
      >
        {loading ? (
          <span className="flex items-center gap-2"><Spinner /> Placing Order…</span>
        ) : '🚀 Place Order & Track'}
      </button>
    </div>
  )

  return (
    <div className="page-container page-section animate-fade-in">
      <h1 className="section-title mb-6">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Stepper + Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Steps indicator */}
          <div className="flex items-center gap-2">
            {PAYMENT_STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${i < step ? 'bg-canteen-success text-white' : i === step ? 'bg-primary text-white shadow-primary' : 'bg-canteen-border text-canteen-muted'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-sm font-semibold ${i === step ? 'text-secondary' : 'text-canteen-muted'}`}>{s}</span>
                {i < PAYMENT_STEPS.length - 1 && <div className="flex-1 h-0.5 bg-canteen-border" />}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="card card-body">
            {step === 0 && <ReviewStep />}
            {step === 1 && <PaymentStep />}
            {step === 2 && <ConfirmStep />}
          </div>
        </div>

        {/* Order summary sidebar */}
        <div className="card card-body h-fit sticky top-24 space-y-3">
          <h3 className="card-title">Price Breakdown</h3>
          <div className="space-y-2 text-sm text-canteen-muted">
            <div className="flex justify-between">
              <span>Subtotal ({items.length} items)</span>
              <span className="text-secondary font-semibold">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (5%)</span>
              <span className="text-secondary font-semibold">{formatCurrency(taxes)}</span>
            </div>
            <div className="flex justify-between">
              <span>Pickup fee</span>
              <span className="text-canteen-success font-bold">Free</span>
            </div>
          </div>
          <div className="divider" />
          <div className="flex justify-between font-display font-bold text-secondary">
            <span>Total</span>
            <span className="text-primary text-lg">{formatCurrency(grandTotal)}</span>
          </div>
          <div className="alert-info text-xs">
            ℹ Collect your order at the canteen counter once notified.
          </div>
        </div>

      </div>
    </div>
  )
}

function Spinner() {
  return <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
}

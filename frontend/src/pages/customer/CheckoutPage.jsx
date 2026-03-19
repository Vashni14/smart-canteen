import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '@context/CartContext'
import { useAuth } from '@context/AuthContext'
import { orderService, paymentService } from '@services/index'
import { formatCurrency } from '@utils/index'
import toast from 'react-hot-toast'

const PAYMENT_METHODS = [
  { id: 'razorpay', label: 'Pay Online',     icon: '💳', desc: 'UPI, Cards, Wallets via Razorpay' },
  { id: 'cash',     label: 'Pay at Counter', icon: '💵', desc: 'Pay when collecting your order' },
]

const STEPS = ['Review', 'Payment', 'Confirm']

/* Load Razorpay SDK dynamically */
function loadRazorpayScript() {
  return new Promise(resolve => {
    if (document.querySelector('script[src*="checkout.razorpay"]')) {
      resolve(true); return
    }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload  = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export default function CheckoutPage() {
  const { items, totalAmount, clearCart } = useCart()
  const { user }   = useAuth()
  const navigate   = useNavigate()

  const [step, setStep]           = useState(0)
  const [payMethod, setPayMethod] = useState('razorpay')
  const [orderNote, setOrderNote] = useState('')
  const [loading, setLoading]     = useState(false)
  const [rzpKey, setRzpKey]       = useState(null)
  const [rzpAvailable, setRzpAvail] = useState(true)
  const [isTestMode, setTestMode]   = useState(false)

  const taxes     = Math.round(totalAmount * 0.05)
  const grandTotal = totalAmount + taxes

  // Fetch Razorpay key on mount to know if it's configured
  useEffect(() => {
    paymentService.getKey()
      .then(res => {
        if (res.data?.key) {
          setRzpKey(res.data.key)
          setRzpAvail(true)
          setTestMode(res.data.testMode === true)
        } else {
          // Razorpay not configured — fall back to cash only
          setRzpAvail(false)
          setPayMethod('cash')
        }
      })
      .catch(() => { setRzpAvail(false); setPayMethod('cash') })
  }, [])

  if (items.length === 0) {
    navigate('/menu', { replace: true })
    return null
  }

  /* ── Place order (shared for cash + post-payment) ─── */
  const placeOrder = async ({ paymentStatus = 'pending', razorpayOrderId = '', razorpayPaymentId = '' } = {}) => {
    const payload = {
      items: items.map(i => ({
        menuItem: i._id,
        name:     i.name,
        price:    i.price,
        qty:      i.qty,
        note:     i.note || '',
      })),
      paymentMethod: payMethod === 'razorpay' ? 'upi' : 'cash',
      notes: orderNote,
      ...(razorpayOrderId && { razorpayOrderId }),
      ...(razorpayPaymentId && { razorpayPaymentId }),
    }
    const res = await orderService.create(payload)
    const orderId = res.data?.order?._id || res.data?._id
    return orderId
  }

  /* ── Cash flow ───────────────────────────────────── */
  const handleCashOrder = async () => {
    setLoading(true)
    try {
      const orderId = await placeOrder()
      clearCart()
      toast.success('Order placed! 🎉')
      navigate(`/orders/${orderId}/track`, { replace: true })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  /* ── Razorpay flow ───────────────────────────────── */
  const handleRazorpayPayment = async () => {
    setLoading(true)
    try {
      // 1. Load SDK
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        toast.error('Could not load payment gateway. Check your internet connection.')
        setLoading(false)
        return
      }

      // 2. Create Razorpay order on our backend
      const rzpRes = await paymentService.createOrder({
        amount:  grandTotal,
        receipt: `rcpt_${Date.now()}`,
      })
      const { orderId: rzpOrderId, amount: rzpAmount, currency, key } = rzpRes.data

      // 3. Open Razorpay checkout
      const options = {
        key:          key || rzpKey,
        amount:       rzpAmount,
        currency:     currency || 'INR',
        name:         'Smart Canteen',
        description:  `Order — ${items.length} item(s)`,
        order_id:     rzpOrderId,
        prefill: {
          name:  user?.name  || '',
          email: user?.email || '',
        },
        theme: { color: '#FF6B35' },

        handler: async (response) => {
          // 4. Verify payment on backend
          try {
            await paymentService.verifyPayment({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            })

            // 5. Place the actual order in our DB
            const orderId = await placeOrder({
              paymentStatus:    'paid',
              razorpayOrderId:  response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
            })

            clearCart()
            toast.success('Payment successful! Order placed 🎉')
            navigate(`/orders/${orderId}/track`, { replace: true })
          } catch (err) {
            toast.error('Payment received but order failed. Please contact the canteen counter.')
            console.error('Post-payment order error:', err)
          } finally {
            setLoading(false)
          }
        },

        modal: {
          ondismiss: () => {
            setLoading(false)
            toast('Payment cancelled', { icon: '⚠️' })
          },
        },
      }

      const rzp = new window.Razorpay(options)

      rzp.on('payment.failed', (response) => {
        setLoading(false)
        toast.error(`Payment failed: ${response.error.description}`)
      })

      rzp.open()

    } catch (err) {
      setLoading(false)
      toast.error(err?.response?.data?.message || 'Could not initiate payment')
    }
  }

  /* ── Test mode: simulate payment without real Razorpay ── */
  const handleSimulatedPayment = async () => {
    setLoading(true)
    try {
      // Create a Razorpay order just to get an order ID
      const rzpRes = await paymentService.createOrder({ amount: grandTotal, receipt: `sim_${Date.now()}` })
      const { orderId: rzpOrderId } = rzpRes.data

      // Verify with test_simulated sentinel — backend bypasses HMAC check in test mode
      await paymentService.verifyPayment({
        razorpay_order_id:   rzpOrderId,
        razorpay_payment_id: `sim_pay_${Date.now()}`,
        razorpay_signature:  'test_simulated',
      })

      // Place the order
      const orderId = await placeOrder({ paymentStatus: 'paid', razorpayOrderId: rzpOrderId })
      clearCart()
      toast.success('Simulated payment successful! Order placed 🎉')
      navigate(`/orders/${orderId}/track`, { replace: true })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Simulation failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePay = () => {
    if (payMethod === 'cash') {
      handleCashOrder()
    } else {
      handleRazorpayPayment()
    }
  }

  /* ── Step 0: Review ─────────────────────────────── */
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

      <div className="form-group">
        <label className="form-label">Order Note (optional)</label>
        <textarea
          value={orderNote}
          onChange={e => setOrderNote(e.target.value)}
          placeholder="Any special requests…"
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

  /* ── Step 1: Payment ────────────────────────────── */
  const PaymentStep = () => (
    <div className="space-y-4 animate-slide-in">
      <h2 className="text-lg font-display font-bold text-secondary">Payment Method</h2>

      <div className="space-y-2">
        {PAYMENT_METHODS
          .filter(pm => pm.id === 'cash' || rzpAvailable)
          .map(pm => (
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
          ))
        }

        {!rzpAvailable && (
          <div className="text-xs text-canteen-muted text-center p-2 bg-canteen-bg rounded-xl">
            Online payment not configured. Using cash only.
          </div>
        )}
      </div>

      {/* Razorpay badge */}
      {payMethod === 'razorpay' && (
        <div className="flex items-center justify-center gap-2 text-xs text-canteen-muted">
          <span>🔒 Secured by</span>
          <span className="font-bold text-secondary">Razorpay</span>
          <span>· UPI · Cards · Wallets · Netbanking</span>
        </div>
      )}

      {/* Test mode banner + simulate button */}
      {payMethod === 'razorpay' && isTestMode && (
        <div className="rounded-2xl border-2 border-dashed border-yellow-300 bg-yellow-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧪</span>
            <div>
              <p className="text-sm font-bold text-yellow-800">Test Mode Active</p>
              <p className="text-xs text-yellow-700">Razorpay QR codes don't work in test mode. Use the simulate button below or enter test card details in the Razorpay modal.</p>
            </div>
          </div>
          <div className="bg-yellow-100 rounded-xl p-3 text-xs text-yellow-800 space-y-1">
            <p className="font-bold">Test card (works in Razorpay modal):</p>
            <p>Card: <span className="font-mono">4111 1111 1111 1111</span></p>
            <p>Expiry: any future date &nbsp;·&nbsp; CVV: any 3 digits &nbsp;·&nbsp; OTP: <span className="font-mono">1234</span></p>
          </div>
          <button
            onClick={handleSimulatedPayment}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Spinner /> Processing…</> : '⚡ Simulate Payment (Test Mode)'}
          </button>
        </div>
      )}

      <div className="card card-body bg-canteen-bg">
        <div className="flex justify-between font-display font-bold text-secondary text-lg">
          <span>Amount to Pay</span>
          <span className="text-primary">{formatCurrency(grandTotal)}</span>
        </div>
      </div>

      <button
        onClick={handlePay}
        disabled={loading}
        className="btn-primary w-full btn-lg"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner />
            {payMethod === 'cash' ? 'Placing order…' : 'Opening payment…'}
          </span>
        ) : (
          payMethod === 'cash'
            ? 'Place Order (Pay at Counter)'
            : `Pay ${formatCurrency(grandTotal)} via Razorpay`
        )}
      </button>

      <button onClick={() => setStep(0)} className="btn-ghost w-full" disabled={loading}>
        ← Back to Review
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
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${i < step ? 'bg-canteen-success text-white' : i === step ? 'bg-primary text-white shadow-primary' : 'bg-canteen-border text-canteen-muted'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-sm font-semibold ${i === step ? 'text-secondary' : 'text-canteen-muted'}`}>{s}</span>
                {i < STEPS.length - 1 && <div className="flex-1 h-0.5 bg-canteen-border" />}
              </div>
            ))}
          </div>

          <div className="card card-body">
            {step === 0 && <ReviewStep />}
            {step === 1 && <PaymentStep />}
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
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
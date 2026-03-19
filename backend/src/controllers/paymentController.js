const Razorpay  = require('razorpay')
const crypto    = require('crypto')
const Order     = require('../models/Order')

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env')
  }
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

/* POST /api/payment/create-order
   Called before showing Razorpay checkout.
   Creates a Razorpay order and returns the order_id + key for the frontend. */
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' })
    }

    const razorpay = getRazorpay()

    const rzpOrder = await razorpay.orders.create({
      amount:   Math.round(amount * 100), // Razorpay expects paise
      currency,
      receipt:  receipt || `rcpt_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        userName: req.user.name,
      },
    })

    res.json({
      success:    true,
      orderId:    rzpOrder.id,         // rzp_order_id to pass to checkout
      amount:     rzpOrder.amount,     // in paise
      currency:   rzpOrder.currency,
      key:        process.env.RAZORPAY_KEY_ID,
    })
  } catch (err) {
    if (err.message.includes('credentials not configured')) {
      return res.status(503).json({ message: err.message })
    }
    next(err)
  }
}

/* POST /api/payment/verify
   Called after Razorpay checkout success.
   Verifies the payment signature, then marks order as paid. */
exports.verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,           // our MongoDB order ID
    } = req.body

    const isTestMode = (process.env.RAZORPAY_KEY_ID || '').startsWith('rzp_test_')

    // Test mode: simulated payment bypasses real signature check
    if (razorpay_signature === 'test_simulated' && isTestMode) {
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          paymentStatus:     'paid',
          razorpayOrderId:   razorpay_order_id  || 'sim_order',
          razorpayPaymentId: razorpay_payment_id || 'sim_payment',
        })
      }
      return res.json({ success: true, paymentId: 'sim_payment', simulated: true })
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification fields' })
    }

    // Verify HMAC signature (production)
    const secret    = process.env.RAZORPAY_KEY_SECRET
    const body      = razorpay_order_id + '|' + razorpay_payment_id
    const expected  = crypto.createHmac('sha256', secret).update(body).digest('hex')

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed — invalid signature' })
    }

    // Mark our order as paid
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus:    'paid',
        razorpayOrderId:  razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      })
    }

    res.json({
      success:   true,
      paymentId: razorpay_payment_id,
      message:   'Payment verified successfully',
    })
  } catch (err) { next(err) }
}

/* GET /api/payment/key  — returns public key for frontend (no auth needed) */
exports.getKey = async (req, res) => {
  const key = process.env.RAZORPAY_KEY_ID || null
  res.json({
    key,
    configured: !!key,
    testMode: key ? key.startsWith('rzp_test_') : false,
  })
}
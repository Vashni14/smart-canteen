const Order    = require('../models/Order')
const MenuItem = require('../models/MenuItem')
const { getIO } = require('../config/socket')

/* ── Status transition rules ─────────────────────────────── */
const ALLOWED_TRANSITIONS = {
  pending:   ['accepted', 'cancelled'],
  accepted:  ['preparing', 'cancelled'],
  preparing: ['ready'],
  ready:     ['collected'],
  collected: [],
  cancelled: [],
}

/* POST /api/orders  [customer] */
exports.create = async (req, res, next) => {
  try {
    const { items, paymentMethod, notes } = req.body

    if (!items?.length) return res.status(400).json({ message: 'Order must have at least one item' })

    // Validate items & recalculate price server-side
    let totalPrice = 0
    const validatedItems = []

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem)
      if (!menuItem)          return res.status(400).json({ message: `Item not found: ${item.menuItem}` })
      if (!menuItem.available) return res.status(400).json({ message: `"${menuItem.name}" is currently unavailable` })

      const subtotal = menuItem.price * item.qty
      totalPrice    += subtotal
      validatedItems.push({
        menuItem: menuItem._id,
        name:     menuItem.name,
        price:    menuItem.price,
        qty:      item.qty,
        note:     item.note || '',
      })
    }

    // Apply GST (5%)
    const taxes    = Math.round(totalPrice * 0.05)
    totalPrice    += taxes

    const order = await Order.create({
      userId:        req.user._id,
      items:         validatedItems,
      totalPrice,
      paymentMethod: paymentMethod || 'upi',
      notes:         notes || '',
    })

    const populated = await Order.findById(order._id).populate('userId', 'name email')

    // Notify kitchen + admin
    getIO().to('chef').emit('order:new', populated)
    getIO().to('admin').emit('order:new', populated)

    res.status(201).json({ success: true, order: populated })
  } catch (err) { next(err) }
}

/* GET /api/orders/user/:userId  [customer] */
exports.getMyOrders = async (req, res, next) => {
  try {
    // Customers can only see their own orders
    const userId = req.user.role === 'customer' ? req.user._id : req.params.userId
    const orders = await Order.find({ userId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(50)
    res.json({ success: true, orders })
  } catch (err) { next(err) }
}

/* GET /api/orders/kitchen  [chef, admin] — active orders */
exports.getKitchen = async (req, res, next) => {
  try {
    const orders = await Order.find({
      status: { $in: ['pending', 'accepted', 'preparing', 'ready'] },
    })
      .populate('userId', 'name email')
      .sort({ createdAt: 1 })   // oldest first
    res.json({ success: true, orders })
  } catch (err) { next(err) }
}

/* GET /api/orders/ready  [pickup] */
exports.getReady = async (req, res, next) => {
  try {
    const orders = await Order.find({ status: 'ready' })
      .populate('userId', 'name email')
      .sort({ updatedAt: 1 })
    res.json({ success: true, orders })
  } catch (err) { next(err) }
}

/* GET /api/orders/:id */
exports.getById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'name email')
    if (!order) return res.status(404).json({ message: 'Order not found' })

    // Customers can only see their own orders
    if (req.user.role === 'customer' && order.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your order' })
    }

    res.json({ success: true, order })
  } catch (err) { next(err) }
}

/* PUT /api/orders/:id/status  [chef, pickup, admin] */
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order not found' })

    // Validate transition
    const allowed = ALLOWED_TRANSITIONS[order.status] || []
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `Cannot transition from "${order.status}" to "${status}"`,
      })
    }

    order.status = status
    order.statusHistory.push({ status, by: req.user._id })
    if (status === 'collected') order.collectedAt = new Date()

    await order.save()
    const populated = await Order.findById(order._id).populate('userId', 'name email')

    const payload = { _id: order._id, orderId: order._id, status }

    // Notify all relevant rooms
    getIO().to('chef').emit('order:status-updated', populated)
    getIO().to('pickup').emit('order:status-updated', populated)
    getIO().to('admin').emit('order:status-updated', populated)
    getIO().to(`order:${order._id}`).emit('order:status-updated', populated)

    // Special events for pickup counter
    if (status === 'ready')     getIO().to('pickup').emit('order:ready', populated)
    if (status === 'collected') getIO().to('pickup').emit('order:collected', payload)

    res.json({ success: true, order: populated })
  } catch (err) { next(err) }
}

/* PUT /api/orders/:id/collect  [pickup] */
exports.markCollected = async (req, res, next) => {
  req.body.status = 'collected'
  return exports.updateStatus(req, res, next)
}

/* PUT /api/orders/:id/cancel  [customer, admin] */
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order not found' })

    if (req.user.role === 'customer' && order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your order' })
    }

    const allowed = ALLOWED_TRANSITIONS[order.status] || []
    if (!allowed.includes('cancelled')) {
      return res.status(400).json({ message: `Cannot cancel an order with status "${order.status}"` })
    }

    order.status       = 'cancelled'
    order.cancelReason = req.body.reason || ''
    order.statusHistory.push({ status: 'cancelled', by: req.user._id })
    await order.save()

    const payload = { orderId: order._id, _id: order._id }
    getIO().to('chef').emit('order:cancelled', payload)
    getIO().to('pickup').emit('order:cancelled', payload)
    getIO().to('admin').emit('order:cancelled', payload)
    getIO().to(`order:${order._id}`).emit('order:status-updated', { ...payload, status: 'cancelled' })

    res.json({ success: true, order })
  } catch (err) { next(err) }
}

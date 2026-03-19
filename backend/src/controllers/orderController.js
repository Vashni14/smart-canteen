const Order    = require('../models/Order')
const MenuItem = require('../models/MenuItem')
const { getIO } = require('../config/socket')

/* ── Role-based transition rules ────────────────────────────
   chef   : pending→accepted, accepted→preparing, preparing→ready
            ALSO: cancel a pending order (e.g. item out of stock)
   pickup : ready→collected
   admin  : any valid transition + cancel anything pre-collected
   customer: cancel only while pending or accepted
─────────────────────────────────────────────────────────── */
const ALLOWED_TRANSITIONS = {
  pending:   ['accepted', 'cancelled'],
  accepted:  ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],      // admin can cancel mid-prep
  ready:     ['collected'],
  collected: [],
  cancelled: [],
}

// What each role is allowed to do
const ROLE_TRANSITIONS = {
  chef:     { pending: ['accepted', 'cancelled'], accepted: ['preparing'], preparing: ['ready'] },
  pickup:   { ready: ['collected'] },
  admin:    ALLOWED_TRANSITIONS,
  customer: { pending: ['cancelled'], accepted: ['cancelled'] },
}

/* POST /api/orders  [customer] */
exports.create = async (req, res, next) => {
  try {
    const { items, paymentMethod, notes } = req.body
    if (!items?.length) return res.status(400).json({ message: 'Order must have at least one item' })

    let totalPrice = 0
    const validatedItems = []

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem)
      if (!menuItem)           return res.status(400).json({ message: `Item not found: ${item.menuItem}` })
      if (!menuItem.available) return res.status(400).json({ message: `"${menuItem.name}" is currently unavailable` })
      const subtotal = menuItem.price * item.qty
      totalPrice += subtotal
      validatedItems.push({
        menuItem: menuItem._id,
        name:     menuItem.name,
        price:    menuItem.price,
        qty:      item.qty,
        note:     item.note || '',
      })
    }

    const taxes = Math.round(totalPrice * 0.05)
    totalPrice += taxes

    const order = await Order.create({
      userId:        req.user._id,
      items:         validatedItems,
      totalPrice,
      paymentMethod: paymentMethod || 'upi',
      notes:         notes || '',
    })

    const populated = await Order.findById(order._id)
      .populate('userId', 'name email')
    
    getIO().to('chef').emit('order:new', populated)
    getIO().to('admin').emit('order:new', populated)

    res.status(201).json({ success: true, order: populated })
  } catch (err) { next(err) }
}

/* GET /api/orders/user/:userId  [customer] */
exports.getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.role === 'customer' ? req.user._id : req.params.userId
    const orders = await Order.find({ userId })
      .populate('userId', 'name email')
      .populate('acceptedBy', 'name')
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
      .populate('acceptedBy', 'name')
      .sort({ createdAt: 1 })
    res.json({ success: true, orders })
  } catch (err) { next(err) }
}

/* GET /api/orders/kitchen/mine  [chef] — orders this chef is handling */
exports.getMyKitchenOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      acceptedBy: req.user._id,
      status: { $in: ['accepted', 'preparing', 'ready'] },
    })
      .populate('userId', 'name email')
      .sort({ createdAt: 1 })
    res.json({ success: true, orders })
  } catch (err) { next(err) }
}

/* GET /api/orders/ready  [pickup] */
exports.getReady = async (req, res, next) => {
  try {
    const orders = await Order.find({ status: 'ready' })
      .populate('userId', 'name email')
      .populate('acceptedBy', 'name')
      .sort({ updatedAt: 1 })
    res.json({ success: true, orders })
  } catch (err) { next(err) }
}

/* GET /api/orders/:id */
exports.getById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('acceptedBy', 'name')
      .populate('collectedBy', 'name')
    if (!order) return res.status(404).json({ message: 'Order not found' })

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

    const role    = req.user.role
    const allowed = (ROLE_TRANSITIONS[role] || {})[order.status] || []

    if (!allowed.includes(status)) {
      // More helpful error messages
      if (role === 'chef' && status === 'collected') {
        return res.status(403).json({ message: 'Only pickup staff can mark an order as collected' })
      }
      if (role === 'pickup' && ['accepted','preparing'].includes(status)) {
        return res.status(403).json({ message: 'Only kitchen staff can accept or prepare orders' })
      }
      if (role === 'customer' && !['pending','accepted'].includes(order.status)) {
        return res.status(400).json({ message: `You can only cancel orders that haven't started preparing yet` })
      }
      return res.status(400).json({
        message: `Cannot move order from "${order.status}" to "${status}"`,
      })
    }

    // If chef is accepting, track who accepted
    if (status === 'accepted' && role === 'chef') {
      order.acceptedBy = req.user._id
    }

    // If order was accepted by a specific chef, only that chef (or admin) can advance it
    if (['preparing', 'ready'].includes(status) && role === 'chef') {
      if (order.acceptedBy && order.acceptedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: 'This order was accepted by another chef',
        })
      }
    }

    // Track who collected
    if (status === 'collected' && role === 'pickup') {
      order.collectedBy = req.user._id
      order.collectedAt = new Date()
    }

    order.status = status
    order.statusHistory.push({ status, by: req.user._id })
    await order.save()

    const populated = await Order.findById(order._id)
      .populate('userId', 'name email')
      .populate('acceptedBy', 'name')
      .populate('collectedBy', 'name')

    const payload = { _id: order._id, orderId: order._id, status }

    getIO().to('chef').emit('order:status-updated', populated)
    getIO().to('pickup').emit('order:status-updated', populated)
    getIO().to('admin').emit('order:status-updated', populated)
    getIO().to(`order:${order._id}`).emit('order:status-updated', populated)

    if (status === 'ready')     getIO().to('pickup').emit('order:ready', populated)
    if (status === 'collected') getIO().to('pickup').emit('order:collected', payload)
    if (status === 'cancelled') {
      getIO().to('chef').emit('order:cancelled', payload)
      getIO().to('pickup').emit('order:cancelled', payload)
      getIO().to('admin').emit('order:cancelled', payload)
    }

    res.json({ success: true, order: populated })
  } catch (err) { next(err) }
}

/* PUT /api/orders/:id/collect  [pickup] */
exports.markCollected = async (req, res, next) => {
  req.body.status = 'collected'
  return exports.updateStatus(req, res, next)
}

/* PUT /api/orders/:id/cancel  [customer, chef, admin] */
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order not found' })

    const role = req.user.role

    // Customer: can only cancel their own order, only if pending or accepted
    if (role === 'customer') {
      if (order.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not your order' })
      }
      if (!['pending', 'accepted'].includes(order.status)) {
        return res.status(400).json({
          message: `Cannot cancel — order is already ${order.status}`,
        })
      }
    }

    // Chef: can cancel pending orders (e.g. item unavailable) or their own accepted orders
    if (role === 'chef') {
      if (!['pending', 'accepted', 'preparing'].includes(order.status)) {
        return res.status(400).json({ message: `Cannot cancel an order with status "${order.status}"` })
      }
      if (order.status !== 'pending' && order.acceptedBy?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only cancel orders you accepted' })
      }
    }

    // Admin can cancel anything except collected
    if (role === 'admin' && order.status === 'collected') {
      return res.status(400).json({ message: 'Cannot cancel a collected order' })
    }

    order.status       = 'cancelled'
    order.cancelReason = req.body.reason || ''
    order.statusHistory.push({ status: 'cancelled', by: req.user._id })
    await order.save()

    const payload = { orderId: order._id, _id: order._id, cancelReason: order.cancelReason }
    getIO().to('chef').emit('order:cancelled', payload)
    getIO().to('pickup').emit('order:cancelled', payload)
    getIO().to('admin').emit('order:cancelled', payload)
    getIO().to(`order:${order._id}`).emit('order:status-updated', { 
      ...payload, 
      status: 'cancelled',
      cancelReason: order.cancelReason 
    })

    res.json({ success: true, order })
  } catch (err) { next(err) }
}

/* GET /api/orders/all  [admin] */
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50, search } = req.query
    const filter = {}
    if (status && status !== 'all') filter.status = status

    let orders = await Order.find(filter)
      .populate('userId', 'name email')
      .populate('acceptedBy', 'name')
      .populate('collectedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))

    if (search) {
      const s = search.toLowerCase()
      orders = orders.filter(o =>
        o.orderNumber?.toLowerCase().includes(s) ||
        o.userId?.name?.toLowerCase().includes(s) ||
        o.userId?.email?.toLowerCase().includes(s)
      )
    }

    const total = await Order.countDocuments(filter)
    res.json({ success: true, orders, total, page: Number(page) })
  } catch (err) { next(err) }
}
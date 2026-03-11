const Order     = require('../models/Order')
const User      = require('../models/User')
const MenuItem  = require('../models/MenuItem')
const Inventory = require('../models/Inventory')

/* GET /api/admin/stats */
exports.getStats = async (req, res, next) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0)
    const todayEnd   = new Date(); todayEnd.setHours(23,59,59,999)

    const [
      todayOrders,
      activeOrders,
      menuItems,
      unavailableItems,
      todayRevenue,
      lowStockItems,
    ] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
      Order.countDocuments({ status: { $in: ['pending','accepted','preparing','ready'] } }),
      MenuItem.countDocuments(),
      MenuItem.countDocuments({ available: false }),
      Order.aggregate([
        { $match: { createdAt: { $gte: todayStart, $lte: todayEnd }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Inventory.find({ $expr: { $lte: ['$stock', '$threshold'] } }).select('itemName stock'),
    ])

    // Yesterday for trend
    const yStart = new Date(todayStart); yStart.setDate(yStart.getDate()-1)
    const yEnd   = new Date(todayEnd);   yEnd.setDate(yEnd.getDate()-1)
    const [yOrders, yRevenue] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: yStart, $lte: yEnd } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: yStart, $lte: yEnd }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
    ])

    const tRevenue = todayRevenue[0]?.total || 0
    const yRev     = yRevenue[0]?.total || 0

    res.json({
      success: true,
      todayOrders,
      activeOrders,
      menuItems,
      unavailableItems,
      todayRevenue:   tRevenue,
      ordersTrend:    todayOrders - yOrders,
      revenueTrend:   tRevenue - yRev,
      lowStockItems:  lowStockItems.map(i => i.itemName),
    })
  } catch (err) { next(err) }
}

/* GET /api/admin/reports */
exports.getReports = async (req, res, next) => {
  try {
    const { range = '7days' } = req.query

    const now   = new Date()
    const start = new Date(now)
    if (range === 'today')  start.setHours(0,0,0,0)
    else if (range === '7days')  start.setDate(now.getDate() - 7)
    else if (range === '30days') start.setDate(now.getDate() - 30)
    else if (range === 'month')  start.setDate(1), start.setHours(0,0,0,0)

    const baseMatch = { createdAt: { $gte: start, $lte: now } }

    const [orders, revenueByDay, topItems, statusBreakdown, peakHours] = await Promise.all([
      Order.find(baseMatch),

      // Revenue grouped by day
      Order.aggregate([
        { $match: { ...baseMatch, status: { $ne: 'cancelled' } } },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalPrice' },
            count:   { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
      ]),

      // Top items
      Order.aggregate([
        { $match: { ...baseMatch, status: { $ne: 'cancelled' } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.name', count: { $sum: '$items.qty' } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $project: { name: '$_id', count: 1, _id: 0 } },
      ]),

      // Status breakdown
      Order.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Orders by hour
      Order.aggregate([
        { $match: baseMatch },
        { $group: { _id: { $hour: '$createdAt' }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ])

    const nonCancelled = orders.filter(o => o.status !== 'cancelled')
    const totalRevenue = nonCancelled.reduce((s, o) => s + o.totalPrice, 0)

    // Format revenue by day with friendly labels
    const revByDay = revenueByDay.map(d => ({
      label:   new Date(d._id).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
      revenue: d.revenue,
      count:   d.count,
    }))

    // Format status breakdown as object
    const statusObj = {}
    statusBreakdown.forEach(s => { statusObj[s._id] = s.count })

    // Format peak hours
    const hours = peakHours.map(h => ({
      hour:   `${h._id % 12 || 12}${h._id < 12 ? 'am' : 'pm'}`,
      orders: h.orders,
    }))

    // Category breakdown
    const catOrders = await Order.aggregate([
      { $match: { ...baseMatch, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $lookup: { from: 'menuitems', localField: 'items.menuItem', foreignField: '_id', as: 'menu' } },
      { $unwind: { path: '$menu', preserveNullAndEmptyArrays: true } },
      { $group: { _id: { $ifNull: ['$menu.category', 'Other'] }, count: { $sum: '$items.qty' } } },
    ])
    const categoryBreakdown = {}
    catOrders.forEach(c => { categoryBreakdown[c._id] = c.count })

    res.json({
      success: true,
      totalOrders:       orders.length,
      totalRevenue,
      avgOrderValue:     nonCancelled.length ? Math.round(totalRevenue / nonCancelled.length) : 0,
      cancelledOrders:   orders.filter(o => o.status === 'cancelled').length,
      revenueByDay:      revByDay,
      topItems,
      statusBreakdown:   statusObj,
      peakHours:         hours,
      categoryBreakdown,
    })
  } catch (err) { next(err) }
}

/* GET /api/admin/staff */
exports.getStaff = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 })
    res.json({ success: true, users, count: users.length })
  } catch (err) { next(err) }
}

/* PATCH /api/admin/staff/:id/role */
exports.updateRole = async (req, res, next) => {
  try {
    const { role } = req.body
    const allowed  = ['customer', 'chef', 'pickup', 'admin']
    if (!allowed.includes(role)) return res.status(400).json({ message: 'Invalid role' })
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot change your own role' })
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true })
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ success: true, user })
  } catch (err) { next(err) }
}

/* POST /api/admin/staff  — create chef or pickup account */
exports.createStaff = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body
    const allowed = ['chef', 'pickup', 'admin']
    if (!allowed.includes(role)) {
      return res.status(400).json({ message: 'Can only create chef, pickup, or admin accounts' })
    }
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' })
    }
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) return res.status(409).json({ message: 'Email already registered' })

    const user = await User.create({
      name, email: email.toLowerCase(), password, role
    })
    res.status(201).json({ success: true, user })
  } catch (err) { next(err) }
}

/* DELETE /api/admin/staff/:id — remove a user (cannot delete self or admins) */
exports.deleteStaff = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' })
    }
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin accounts' })
    }
    await User.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: `${user.name} has been removed` })
  } catch (err) { next(err) }
}
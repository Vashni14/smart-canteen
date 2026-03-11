const MenuItem = require('../models/MenuItem')
const { getIO }  = require('../config/socket')

/* GET /api/menu */
exports.getAll = async (req, res, next) => {
  try {
    const { category, available, limit } = req.query
    const filter = {}
    if (category && category !== 'All') filter.category = category
    if (available !== undefined) filter.available = available === 'true'

    const query = MenuItem.find(filter).sort({ category: 1, name: 1 })
    if (limit) query.limit(Number(limit))

    const items = await query
    res.json({ success: true, items, count: items.length })
  } catch (err) { next(err) }
}

/* GET /api/menu/:id */
exports.getById = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id)
    if (!item) return res.status(404).json({ message: 'Item not found' })
    res.json({ success: true, item })
  } catch (err) { next(err) }
}

/* POST /api/menu  [admin] */
exports.create = async (req, res, next) => {
  try {
    const item = await MenuItem.create(req.body)
    getIO().to('customer').emit('menu:added', item)
    res.status(201).json({ success: true, item })
  } catch (err) { next(err) }
}

/* PUT /api/menu/:id  [admin] */
exports.update = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    })
    if (!item) return res.status(404).json({ message: 'Item not found' })
    getIO().to('customer').emit('menu:updated', item)
    res.json({ success: true, item })
  } catch (err) { next(err) }
}

/* DELETE /api/menu/:id  [admin] — soft delete */
exports.remove = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id, { deleted: true }, { new: true }
    )
    if (!item) return res.status(404).json({ message: 'Item not found' })
    getIO().to('customer').emit('menu:removed', { _id: req.params.id })
    res.json({ success: true, message: 'Item deleted' })
  } catch (err) { next(err) }
}

/* PATCH /api/menu/:id/toggle  [admin] */
exports.toggleAvailability = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id)
    if (!item) return res.status(404).json({ message: 'Item not found' })
    item.available = !item.available
    await item.save()
    getIO().to('customer').emit('menu:updated', item)
    res.json({ success: true, item })
  } catch (err) { next(err) }
}

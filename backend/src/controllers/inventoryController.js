const Inventory = require('../models/Inventory')

/* GET /api/inventory  [admin, chef] */
exports.getAll = async (req, res, next) => {
  try {
    const inventory = await Inventory.find().sort({ itemName: 1 })
    res.json({ success: true, inventory, count: inventory.length })
  } catch (err) { next(err) }
}

/* PUT /api/inventory/:id  [admin] */
exports.update = async (req, res, next) => {
  try {
    const { stock, threshold, unit } = req.body
    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      { ...(stock     !== undefined && { stock }),
        ...(threshold !== undefined && { threshold }),
        ...(unit       !== undefined && { unit }),
      },
      { new: true, runValidators: true }
    )
    if (!item) return res.status(404).json({ message: 'Inventory item not found' })
    res.json({ success: true, item })
  } catch (err) { next(err) }
}

/* POST /api/inventory/restock  [admin] */
exports.restock = async (req, res, next) => {
  try {
    const { itemId, quantity, note } = req.body
    if (!quantity || quantity <= 0) return res.status(400).json({ message: 'Quantity must be > 0' })

    const item = await Inventory.findById(itemId)
    if (!item) return res.status(404).json({ message: 'Inventory item not found' })

    item.stock += quantity
    item.restockLog.push({ quantity, addedBy: req.user._id, note: note || '' })
    await item.save()

    res.json({ success: true, item, newStock: item.stock })
  } catch (err) { next(err) }
}

/* POST /api/inventory  [admin] — create new inventory entry */
exports.create = async (req, res, next) => {
  try {
    const item = await Inventory.create(req.body)
    res.status(201).json({ success: true, item })
  } catch (err) { next(err) }
}

const mongoose = require('mongoose')

const inventorySchema = new mongoose.Schema({
  itemName: {
    type:     String,
    required: [true, 'Item name required'],
    trim:     true,
    unique:   true,
  },
  // Optional link to a MenuItem
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'MenuItem',
    default: null,
  },
  stock: {
    type:    Number,
    default: 0,
    min:     [0, 'Stock cannot be negative'],
  },
  unit: {
    type:    String,
    default: 'units',  // kg, litres, units, etc.
    trim:    true,
  },
  threshold: {
    type:    Number,
    default: 10,  // Low stock alert below this
    min:     0,
  },
  restockLog: [{
    quantity:  Number,
    addedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt:   { type: Date, default: Date.now },
    note:      String,
  }],
}, { timestamps: true })

// Virtual: is low stock?
inventorySchema.virtual('isLow').get(function () {
  return this.stock <= this.threshold
})

module.exports = mongoose.model('Inventory', inventorySchema)

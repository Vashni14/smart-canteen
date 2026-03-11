const mongoose = require('mongoose')

const inventorySchema = new mongoose.Schema({
  itemName: {
    type:     String,
    required: [true, 'Item name required'],
    trim:     true,
    unique:   true,
  },
  menuItem: {
    type:    mongoose.Schema.Types.ObjectId,
    ref:     'MenuItem',
    default: null,
  },
  stock: {
    type:    Number,
    default: 0,
    min:     [0, 'Stock cannot be negative'],
  },
  unit: {
    type:    String,
    default: 'units',
    trim:    true,
  },
  threshold: {
    type:    Number,
    default: 10,
    min:     0,
  },
  restockLog: [{
    quantity: Number,
    addedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt:  { type: Date, default: Date.now },
    note:     String,
  }],
}, { timestamps: true })

inventorySchema.virtual('isLow').get(function () {
  return this.stock <= this.threshold
})

module.exports =
  mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema)

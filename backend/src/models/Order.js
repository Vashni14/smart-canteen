const mongoose = require('mongoose')

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'MenuItem',
  },
  name:  { type: String, required: true },
  price: { type: Number, required: true },
  qty:   { type: Number, required: true, min: 1 },
  note:  { type: String, default: '', maxlength: 120 },
}, { _id: false })

const statusHistorySchema = new mongoose.Schema({
  status:    String,
  timestamp: { type: Date, default: Date.now },
  by:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { _id: false })

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type:   String,
    unique: true,
  },
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },
  items:      [orderItemSchema],
  totalPrice: {
    type:     Number,
    required: true,
    min:      0,
  },
  status: {
    type:    String,
    enum:    ['pending', 'accepted', 'preparing', 'ready', 'collected', 'cancelled'],
    default: 'pending',
  },
  statusHistory: [statusHistorySchema],
  paymentMethod: {
    type:    String,
    enum:    ['upi', 'card', 'cash'],
    default: 'upi',
  },
  paymentStatus: {
    type:    String,
    enum:    ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  notes:         { type: String, default: '', maxlength: 200 },
  estimatedTime: { type: Number, default: 15 }, // minutes
  collectedAt:   { type: Date },
  cancelReason:  { type: String, default: '' },
}, { timestamps: true })

// Auto-generate order number before save
orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments()
    this.orderNumber = `SC${String(count + 1).padStart(4, '0')}`

    // Log initial status
    this.statusHistory.push({ status: this.status })

    // Set paymentStatus to paid immediately for non-cash
    if (this.paymentMethod !== 'cash') {
      this.paymentStatus = 'paid'
    }
  }
  next()
})

// Indexes for common queries
orderSchema.index({ userId: 1, createdAt: -1 })
orderSchema.index({ status: 1 })
orderSchema.index({ orderNumber: 1 })

module.exports = mongoose.model('Order', orderSchema)

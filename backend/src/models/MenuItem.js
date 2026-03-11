const mongoose = require('mongoose')

const menuItemSchema = new mongoose.Schema({
  name: {
    type:     String,
    required: [true, 'Item name is required'],
    trim:     true,
    maxlength: [80, 'Name too long'],
  },
  description: {
    type:    String,
    trim:    true,
    maxlength: [300, 'Description too long'],
    default: '',
  },
  price: {
    type:     Number,
    required: [true, 'Price is required'],
    min:      [1, 'Price must be at least ₹1'],
  },
  category: {
    type:    String,
    required: true,
    enum:    ['Breakfast', 'Snacks', 'Lunch', 'Dinner', 'Beverages', 'Desserts'],
    default: 'Snacks',
  },
  image: {
    type:    String,
    default: '',
  },
  available: {
    type:    Boolean,
    default: true,
  },
  preparationTime: {
    type:    Number,   // minutes
    default: 5,
    min:     1,
    max:     120,
  },
  // soft-delete
  deleted: {
    type:    Boolean,
    default: false,
    select:  false,
  },
}, { timestamps: true })

// Default query excludes deleted items
menuItemSchema.pre(/^find/, function (next) {
  this.where({ deleted: { $ne: true } })
  next()
})

module.exports = mongoose.model('MenuItem', menuItemSchema)

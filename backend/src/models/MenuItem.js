const mongoose = require('mongoose')

const menuItemSchema = new mongoose.Schema({
  name: {
    type:      String,
    required:  [true, 'Item name is required'],
    trim:      true,
    maxlength: [80, 'Name too long'],
  },
  description: {
    type:      String,
    trim:      true,
    maxlength: [300, 'Description too long'],
    default:   '',
  },
  price: {
    type:     Number,
    required: [true, 'Price is required'],
    min:      [1, 'Price must be at least ₹1'],
  },
  category: {
    type:     String,
    required: true,
    enum:     ['Breakfast', 'Snacks', 'Lunch', 'Dinner', 'Beverages', 'Desserts'],
    default:  'Snacks',
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
    type:    Number,
    default: 5,
    min:     1,
    max:     120,
  },
  deleted: {
    type:    Boolean,
    default: false,
    select:  false,
  },
}, { timestamps: true })

menuItemSchema.pre(/^find/, function (next) {
  this.where({ deleted: { $ne: true } })
  next()
})

module.exports =
  mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema)

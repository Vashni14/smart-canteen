const router             = require('express').Router()
const ctrl               = require('../controllers/paymentController')
const { protect }        = require('../middleware/auth')

router.get('/key',           ctrl.getKey)                     // public — no auth needed
router.post('/create-order', protect, ctrl.createRazorpayOrder)
router.post('/verify',       protect, ctrl.verifyPayment)

module.exports = router
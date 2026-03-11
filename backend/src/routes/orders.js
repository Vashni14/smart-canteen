const router             = require('express').Router()
const ctrl               = require('../controllers/orderController')
const { protect, allow } = require('../middleware/auth')

// All routes require auth
router.use(protect)

router.post('/',                                          allow('customer'),                   ctrl.create)
router.get('/kitchen',                                    allow('chef','admin'),               ctrl.getKitchen)
router.get('/ready',                                      allow('pickup','admin'),             ctrl.getReady)
router.get('/user/:userId',                               allow('customer','admin'),           ctrl.getMyOrders)
router.get('/:id',                                                                             ctrl.getById)
router.put('/:id/status',                                 allow('chef','pickup','admin'),      ctrl.updateStatus)
router.put('/:id/collect',                                allow('pickup','admin'),             ctrl.markCollected)
router.put('/:id/cancel',                                 allow('customer','admin'),           ctrl.cancelOrder)

module.exports = router

const router             = require('express').Router()
const ctrl               = require('../controllers/inventoryController')
const { protect, allow } = require('../middleware/auth')

router.use(protect)

router.get('/',           allow('admin','chef'), ctrl.getAll)
router.post('/restock',   allow('admin'),        ctrl.restock)   // ← must be before /:id
router.post('/',          allow('admin'),        ctrl.create)
router.put('/:id',        allow('admin'),        ctrl.update)

module.exports = router
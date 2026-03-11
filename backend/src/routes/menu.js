const router         = require('express').Router()
const ctrl           = require('../controllers/menuController')
const { protect, allow } = require('../middleware/auth')

router.get('/',           ctrl.getAll)
router.get('/:id',        ctrl.getById)
router.post('/',          protect, allow('admin'), ctrl.create)
router.put('/:id',        protect, allow('admin'), ctrl.update)
router.delete('/:id',     protect, allow('admin'), ctrl.remove)
router.patch('/:id/toggle', protect, allow('admin'), ctrl.toggleAvailability)

module.exports = router

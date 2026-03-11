const router             = require('express').Router()
const ctrl               = require('../controllers/adminController')
const { protect, allow } = require('../middleware/auth')

router.use(protect, allow('admin'))

router.get('/stats',              ctrl.getStats)
router.get('/reports',            ctrl.getReports)
router.get('/staff',              ctrl.getStaff)
router.post('/staff',             ctrl.createStaff)
router.patch('/staff/:id/role',   ctrl.updateRole)
router.delete('/staff/:id',       ctrl.deleteStaff)

module.exports = router
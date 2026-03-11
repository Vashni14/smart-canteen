const router   = require('express').Router()
const { body }       = require('express-validator')
const ctrl           = require('../controllers/authController')
const { protect }    = require('../middleware/auth')
const validate       = require('../middleware/validate')

router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  ctrl.register
)

router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  ctrl.login
)

router.get('/profile',  protect, ctrl.getProfile)
router.put('/profile',  protect, ctrl.updateProfile)

module.exports = router

const jwt  = require('jsonwebtoken')
const User = require('../models/User')

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })

const authResponse = (user, statusCode, res) => {
  const token = signToken(user._id)
  res.status(statusCode).json({ success: true, token, user })
}

/* POST /api/auth/register */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ message: 'Email already registered' })

    const user = await User.create({ name, email, password })
    authResponse(user, 201, res)
  } catch (err) { next(err) }
}

/* POST /api/auth/login */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email }).select('+password')

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account deactivated — contact admin' })
    }

    authResponse(user, 200, res)
  } catch (err) { next(err) }
}

/* GET /api/auth/profile */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    res.json({ success: true, user })
  } catch (err) { next(err) }
}

/* PUT /api/auth/profile */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, password } = req.body
    const user = await User.findById(req.user._id).select('+password')

    if (name)     user.name     = name
    if (password) user.password = password   // pre-save hook will hash it

    await user.save()
    res.json({ success: true, user })
  } catch (err) { next(err) }
}

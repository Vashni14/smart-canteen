require('dotenv').config()
const express = require('express')
const http    = require('http')
const cors    = require('cors')
const morgan  = require('morgan')
const path    = require('path')

const connectDB                   = require('./config/db')
const { init: initSocket }        = require('./config/socket')
const { errorHandler, notFound }  = require('./middleware/errorHandler')

// ── Routes ────────────────────────────────────────────────
const authRoutes      = require('./routes/auth')
const menuRoutes      = require('./routes/menu')
const orderRoutes     = require('./routes/orders')
const inventoryRoutes = require('./routes/inventory')
const adminRoutes     = require('./routes/admin')

// ── App setup ─────────────────────────────────────────────
const app    = express()
const server = http.createServer(app)

// Initialise Socket.io (must be before routes that use getIO())
initSocket(server)

// Connect MongoDB
connectDB()

// ── Middleware ────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// ── API Routes ────────────────────────────────────────────
app.use('/api/auth',      authRoutes)
app.use('/api/menu',      menuRoutes)
app.use('/api/orders',    orderRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/admin',     adminRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV, time: new Date().toISOString() })
})

// ── Error handling ────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

// ── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`\n🚀 SmartCanteen backend running`)
  console.log(`   http://localhost:${PORT}`)
  console.log(`   ENV: ${process.env.NODE_ENV || 'development'}\n`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server closed gracefully')
    process.exit(0)
  })
})

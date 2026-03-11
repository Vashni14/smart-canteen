require('dotenv').config()

const express = require('express')
const http    = require('http')
const cors    = require('cors')
const morgan  = require('morgan')
const path    = require('path')

const connectDB                  = require('./config/db')
const { init: initSocket }       = require('./config/socket')
const { errorHandler, notFound } = require('./middleware/errorHandler')

const authRoutes      = require('./routes/auth')
const menuRoutes      = require('./routes/menu')
const orderRoutes     = require('./routes/orders')
const inventoryRoutes = require('./routes/inventory')
const adminRoutes     = require('./routes/admin')

const app    = express()
const server = http.createServer(app)

initSocket(server)
connectDB()

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, mobile apps)
    if (!origin) return callback(null, true)

    // Allow any localhost port
    if (/^https:\/\/localhost(:\d+)?$/.test(origin)) {
      return callback(null, true)
    }

    // Allow any local network IP (192.168.x.x, 10.x.x.x, 172.x.x.x)
    if (/^https:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01]))\d+\.\d+(:\d+)?$/.test(origin)) {
      return callback(null, true)
    }

    // Allow configured CLIENT_URL (for production)
    if (origin === process.env.CLIENT_URL) {
      return callback(null, true)
    }

    console.warn(`CORS blocked: ${origin}`)
    callback(new Error(`CORS blocked: ${origin}`))
  },
  credentials: true,
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(morgan('dev'))

app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.use('/api/auth',      authRoutes)
app.use('/api/menu',      menuRoutes)
app.use('/api/orders',    orderRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/admin',     adminRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV, time: new Date().toISOString() })
})

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5001
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 SmartCanteen backend running`)
  console.log(`   Local:   http://localhost:${PORT}`)
  console.log(`   Network: http://<your-ip>:${PORT}`)
  console.log(`   CORS:    localhost + local network IPs allowed\n`)
})
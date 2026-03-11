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
    // Allow requests with no origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true)
    // Allow any localhost port in development
    if (process.env.NODE_ENV === 'development' && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      return callback(null, true)
    }
    // Allow configured CLIENT_URL in production
    if (origin === process.env.CLIENT_URL) {
      return callback(null, true)
    }
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

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`\n🚀 SmartCanteen backend: http://localhost:${PORT}`)
  console.log(`   CORS: all localhost ports allowed in development\n`)
})

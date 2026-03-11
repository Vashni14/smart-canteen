let _io = null

const init = (server) => {
  const { Server } = require('socket.io')

  _io = new Server(server, {
    cors: {
      origin:      process.env.CLIENT_URL || 'http://localhost:3000',
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout:  60000,
    pingInterval: 25000,
  })

  _io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`)

    // ── Room joins ─────────────────────────────────────────
    // Frontend emits 'join-room' with role or 'user-<id>'
    socket.on('join-room', (room) => {
      socket.join(room)
      console.log(`  → ${socket.id} joined room: ${room}`)
    })

    // Legacy alias (in case any client uses old event name)
    socket.on('join:role', (role) => {
      socket.join(role)
      console.log(`  → ${socket.id} joined role room: ${role}`)
    })

    socket.on('join:order', (orderId) => {
      socket.join(`order:${orderId}`)
      console.log(`  → ${socket.id} joined order room: order:${orderId}`)
    })

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`)
    })

    socket.on('error', (err) => {
      console.error(`Socket error [${socket.id}]:`, err.message)
    })
  })

  return _io
}

const getIO = () => {
  if (!_io) throw new Error('Socket.io not initialised — call init(server) first')
  return _io
}

module.exports = { init, getIO }

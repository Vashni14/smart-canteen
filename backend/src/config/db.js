const mongoose = require('mongoose')

const connectDB = async () => {
  const uri = process.env.MONGO_URI

  if (!uri) {
    console.error('❌ MONGO_URI is not set in .env')
    process.exit(1)
  }

  try {
    const conn = await mongoose.connect(uri, {
      // MongoDB Atlas recommended options
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS:          45000,
      maxPoolSize:              10,
      retryWrites:              true,
    })
    const host = conn.connection.host
    const db   = conn.connection.name
    console.log(`✅ MongoDB Atlas connected`)
    console.log(`   Host: ${host}`)
    console.log(`   DB:   ${db}`)
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`)
    console.log('⏳ Retrying in 5 seconds…')
    setTimeout(connectDB, 5000)
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected — attempting reconnect…')
})

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected')
})

module.exports = connectDB

import path from 'path'
import { fileURLToPath } from 'url'
import http from 'http'

// import routers
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { Server as SocketIOServer } from 'socket.io'
import authRoutes from './routes/index.js'

// Importing jobs and listeners
import { syncGroupMember, cleanupMembers } from './jobs/index.js'
import { groupSync } from './listeners/index.js'
import { napcatService } from './services/index.js'

// start jobs and listeners
// Init Napcat connection softly
await napcatService.connect()

// Don't block startup for sync
syncGroupMember().catch(err => console.error('Group sync failed:', err))
cleanupMembers()
groupSync()

// Initialize the Express application
const app = express()

// Create HTTP server
const server = http.createServer(app)

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.NODE_ENV === 'development' ? (process.env.ALLOW_ORIGIN ? process.env.ALLOW_ORIGIN.split(',').map(origin => origin.trim()) : []) : false,
    credentials: true
  }
})

// Make io available globally for services
global.io = io

// Enable CORS if in development environment
if (process.env.NODE_ENV === 'development') {
  app.use(cors({
    origin: process.env.ALLOW_ORIGIN ? process.env.ALLOW_ORIGIN.split(',').map(origin => origin.trim()) : [], // Allow all origins in development
    credentials: true
  }))
}

app.use(cookieParser())
app.use(express.json())
app.use('/api', authRoutes)

// openapi.json
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.get('/openapi.json', (_, res) => {
  res.sendFile(path.join(__dirname, '../docs/openapi.json'))
})

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

// app.use(errorHandler);

export default server

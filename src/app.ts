import path from 'path'
import { fileURLToPath } from 'url'

// import routers
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
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

// Enable CORS if in development environment
if (process.env.NODE_ENV === 'development') {
  app.use(cors({
    origin: process.env.ALLOW_ORIGIN, // Allow all origins in development
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

// app.use(errorHandler);

export default app

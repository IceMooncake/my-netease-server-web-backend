// index.ts
import express from 'express'
import authRoutes from './routes/index.routes.ts'

// Importing jobs and listeners
import './jobs/index.job.ts'
import './listeners/index.listener.ts'

// Initialize the Express application
const app = express()
app.use(express.json())
app.use('/api', authRoutes)
// app.use(errorHandler);

export default app

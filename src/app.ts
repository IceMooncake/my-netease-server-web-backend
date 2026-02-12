import path from 'path';
import { fileURLToPath } from 'url';

// import routers
import express from 'express'
import authRoutes from './routes/index.js'

// Importing jobs and listeners
import { syncGroupMember } from './jobs/index.js'
import { groupSync } from './listeners/index.js'

// start jobs and listeners
await syncGroupMember()
groupSync()

// Initialize the Express application
const app = express()
app.use(express.json())
app.use('/api', authRoutes)

// openapi.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.get('/openapi.json', (_, res) => {
  res.sendFile(path.join(__dirname, '../doc/openapi.json'));
});

// app.use(errorHandler);

export default app

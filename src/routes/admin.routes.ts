// src/routes/admin.routes.ts
import { Router } from 'express'
import { requireAdmin, authenticateToken } from '../middlewares/auth.ts'
import * as Admin from '../controllers/admin.controller.ts'

const r = Router()
r.use(authenticateToken, requireAdmin)

r.get('/applications', Admin.listApplications)
r.post('/applications/:id/decide', Admin.decideApplication)

export default r
// Export the router for use in the main app
export { r as adminRoutes }

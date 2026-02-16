import { Router } from 'express'
import admin from './admin.routes.js'
import auth from './auth.routes.js'
import notifications from './notification.routes.js'
import territories from './territories.routes.js'

const router = Router()

router.use('/auth', auth)
router.use('/territories', territories)
router.use('/admin', admin)
router.use('/notifications', notifications)

export default router

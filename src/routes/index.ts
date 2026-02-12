import { Router } from 'express'
import territories from './territories.routes.js'
import admin from './admin.routes.js'
import auth from './auth.routes.js'

const router = Router()

router.use('/auth', auth)
router.use('/territories', territories)
router.use('/admin', admin)

export default router

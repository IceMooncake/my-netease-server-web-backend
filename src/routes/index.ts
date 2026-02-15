import { Router } from 'express'
import territories from './territories.routes.js'
import admin from './admin.routes.js'
import auth from './auth.routes.js'
import credits from './credit.routes.js'

const router = Router()

router.use('/auth', auth)
router.use('/territories', territories)
router.use('/admin', admin)
router.use('/credits', credits)

export default router


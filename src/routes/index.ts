import { Router } from 'express'
import territories from './territories.routes.js'
import admin from './admin.routes.js'
import auth from './auth.routes.js'
import teams from './team.routes.js'
import credits from './credit.routes.js'
import votes from './vote.routes.js'

const router = Router()

router.use('/auth', auth)
router.use('/territories', territories)
router.use('/admin', admin)
router.use('/teams', teams)
router.use('/credits', credits)
router.use('/votes', votes)

export default router

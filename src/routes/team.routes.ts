// src/routes/team.routes.ts
import { Router } from 'express'
import * as controller from '../controllers/team.controller.js'
import { authenticateToken } from '../middlewares/auth.js'
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { RouteRegistrar } from '../utils/routeRegistrar.js'
import { 
    CreateTeamBody, 
    CreateTeamResponse, 
    JoinTeamBody, 
    TransferBody,
    SuccessResponse
} from '../schemas/team.schema.js'

export const registry = new OpenAPIRegistry()
const router = Router()
const registrar = new RouteRegistrar(registry, '/teams')

// Apply auth middleware to all routes
router.use(authenticateToken)

registrar.register(router, {
  method: 'post',
  path: '/create',
  tags: ['Team'],
  summary: 'Create a new team',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: CreateTeamBody } },
    },
  },
  responses: {
    200: {
      description: 'Team created successfully',
      content: { 'application/json': { schema: CreateTeamResponse } },
    },
  },
  handler: controller.createTeam,
})

registrar.register(router, {
  method: 'post',
  path: '/join',
  tags: ['Team'],
  summary: 'Join a team',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: JoinTeamBody } },
    },
  },
  responses: {
    200: {
      description: 'Joined successfully',
      content: { 'application/json': { schema: SuccessResponse } },
    },
  },
  handler: controller.joinTeam,
})

registrar.register(router, {
  method: 'post',
  path: '/leave',
  tags: ['Team'],
  summary: 'Leave a team',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: JoinTeamBody } }, // Reusing JoinTeamBody as it has teamId
    },
  },
  responses: {
    200: {
      description: 'Left successfully',
      content: { 'application/json': { schema: SuccessResponse } },
    },
  },
  handler: controller.leaveTeam,
})

registrar.register(router, {
  method: 'post',
  path: '/transfer',
  tags: ['Team'],
  summary: 'Transfer team ownership',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: TransferBody } },
    },
  },
  responses: {
    200: {
      description: 'Transferred successfully',
      content: { 'application/json': { schema: SuccessResponse } },
    },
  },
  handler: controller.transferOwnership,
})

export default router

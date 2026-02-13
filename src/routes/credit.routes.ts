// src/routes/credit.routes.ts
import { Router } from 'express'
import * as controller from '../controllers/credit.controller.js'
import { authenticateToken } from '../middlewares/auth.js'
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { RouteRegistrar } from '../utils/routeRegistrar.js'
import { ContributeBody, SuccessResponse } from '../schemas/credit.schema.js'

export const registry = new OpenAPIRegistry()
const router = Router()
const registrar = new RouteRegistrar(registry, '/credits')

router.use(authenticateToken)

registrar.register(router, {
  method: 'post',
  path: '/contribute',
  tags: ['Credit'],
  summary: 'Contribute personal credits to team',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: ContributeBody } },
    },
  },
  responses: {
    200: {
      description: 'Contribution successful',
      content: { 'application/json': { schema: SuccessResponse } },
    },
  },
  handler: controller.contribute,
})

export default router

// src/routes/territories.routes.ts
import { Router } from 'express'
import * as controller from '../controllers/territory.controller.js'
import { authenticateToken } from '../middlewares/auth.js'
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { RouteRegistrar } from '../utils/routeRegistrar.js'
import { 
    ProposeCreateBody, 
    ProposeDeleteBody, 
    ProposeCreateResponse, 
    SuccessResponse,
    TerritoryQuery,
    TerritoryListResponse
} from '../schemas/territory.schema.js'

export const registry = new OpenAPIRegistry()
const router = Router()
const registrar = new RouteRegistrar(registry, '/territories')

router.use(authenticateToken)

registrar.register(router, {
  method: 'post',
  path: '/create',
  tags: ['Territory'],
  summary: 'Propose creating a new territory',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: ProposeCreateBody } },
    },
  },
  responses: {
    200: {
      description: 'Proposal created',
      content: { 'application/json': { schema: ProposeCreateResponse } },
    },
  },
  handler: controller.proposeCreate,
})

registrar.register(router, {
  method: 'post',
  path: '/delete',
  tags: ['Territory'],
  summary: 'Propose deleting an existing territory',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: ProposeDeleteBody } },
    },
  },
  responses: {
    200: {
      description: 'Delete proposal created',
      content: { 'application/json': { schema: SuccessResponse } },
    },
  },
  handler: controller.proposeDelete,
})

registrar.register(router, {
  method: 'get',
  path: '/',
  tags: ['Territory'],
  summary: 'List territories',
  security: [{ bearerAuth: [] }],
  request: {
    query: TerritoryQuery
  },
  responses: {
    200: {
      description: 'List of territories',
      content: { 'application/json': { schema: TerritoryListResponse } },
    },
  },
  handler: controller.listTerritories,
})

export default router

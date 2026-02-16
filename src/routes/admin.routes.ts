// src/routes/admin.routes.ts
import { Router } from 'express'
import * as controller from '../controllers/admin.controller.js'
import { authenticateToken, requireAdmin } from '../middlewares/auth.js'
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { RouteRegistrar } from '../utils/routeRegistrar.js'
import { 
    ListTasksQuery, 
    ListTasksResponse, 
    ProcessTaskBody, 
    SuccessResponse 
} from '../schemas/admin.schema.js'

export const registry = new OpenAPIRegistry()
const router = Router()
const registrar = new RouteRegistrar(registry, '/admin')

router.use(authenticateToken)
router.use(requireAdmin)

registrar.register(router, {
  method: 'get',
  path: '/tasks',
  tags: ['Admin'],
  summary: 'List admin tasks',
  request: {
    query: ListTasksQuery,
  },
  responses: {
    200: {
      description: 'List of tasks',
      content: { 'application/json': { schema: ListTasksResponse } },
    },
  },
  handler: controller.listTasks,
})

registrar.register(router, {
  method: 'post',
  path: '/process',
  tags: ['Admin'],
  summary: 'Process an admin task',
  request: {
    body: {
      content: { 'application/json': { schema: ProcessTaskBody } },
    },
  },
  responses: {
    200: {
      description: 'Task processed',
      content: { 'application/json': { schema: SuccessResponse } },
    },
  },
  handler: controller.processTask,
})

export default router

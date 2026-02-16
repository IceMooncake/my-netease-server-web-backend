import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { Router } from 'express'
import { z } from 'zod'
import * as controller from '../controllers/notification.controller.js'
import { authenticateToken } from '../middlewares/auth.js'
import { NotificationListResponse } from '../schemas/notification.schema.js'
import { SuccessMessageResponse } from '../schemas/territory.schema.js'
import { RouteRegistrar } from '../utils/routeRegistrar.js'

export const registry = new OpenAPIRegistry()
const router = Router()
const registrar = new RouteRegistrar(registry, '/notifications')

router.use(authenticateToken)

registrar.register(router, {
  method: 'get',
  path: '',
  tags: ['Notification'],
  summary: 'List unread notifications',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'List of unread notifications',
      content: { 'application/json': { schema: NotificationListResponse } },
    },
  },
  handler: controller.listUnread,
})

registrar.register(router, {
  method: 'put',
  path: '/{id}/read',
  tags: ['Notification'],
  summary: 'Mark notification as read',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Notification marked as read',
      content: { 'application/json': { schema: SuccessMessageResponse } },
    },
  },
  handler: controller.markRead,
})

export default router

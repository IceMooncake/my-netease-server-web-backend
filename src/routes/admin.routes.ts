// src/routes/admin.routes.ts
import { Router } from 'express'
import { requireAdmin, authenticateToken } from '../middlewares/auth.js'
import * as Admin from '../controllers/admin.controller.js'
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { RouteRegistrar } from '../utils/routeRegistrar.js'
import {
  ListApplicationsQuery,
  DecideApplicationBody,
  DecideApplicationParams,
  // DecideApplicationResponse, // Controller seems to just return {success: true} in generateOpenApi, check implementation?
} from '../schemas/admin.schema.js'
import { z } from 'zod'

export const registry = new OpenAPIRegistry()
const r = Router()
const registrar = new RouteRegistrar(registry, '/api/admin')

r.use(authenticateToken, requireAdmin)

// Note: Global middleware on router is not reflected in OpenAPI 'security' scheme automatically unless we configure it.
// For now we just register paths.

registrar.register(r, {
  method: 'get',
  path: '/applications',
  tags: ['Admin'],
  summary: 'List territory applications',
  request: {
    query: ListApplicationsQuery,
  },
  responses: {
    200: {
      description: 'List of applications',
      content: {
        'application/json': {
          // Using a simple schema as placeholder or the full one if controller matches.
          // Original generateOpenApi used a simplified inline schema.
          // Let's use a generic array object for safety or what was there.
          /* 
          schema: z.array(
              z.object({
                id: z.number(),
                status: ListApplicationsQuery.shape.status,
              })
            ),
          */
          // Better to use a basic schema if we aren't sure about the full Response schema matching controller
          schema: z.array(z.object({ id: z.number(), status: z.string() }).passthrough()),
        },
      },
    },
  },
  handler: Admin.listApplications,
})

registrar.register(r, {
  method: 'post',
  path: '/applications/{id}/decide',
  tags: ['Admin'],
  summary: 'Approve or reject application',
  request: {
    params: DecideApplicationParams,
    body: {
      content: { 'application/json': { schema: DecideApplicationBody } },
    },
  },
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.object({ success: z.boolean() }) } },
    },
  },
  handler: Admin.decideApplication,
})

export default r
export { r as adminRoutes }

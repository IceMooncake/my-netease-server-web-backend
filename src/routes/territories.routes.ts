import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { Router } from 'express'
import { z } from 'zod'
import * as controller from '../controllers/territory.controller.js'
import { authenticateToken } from '../middlewares/auth.js'
import {
  CreateTerritorySchema,
  DonateSchema,
  InvitationListResponse,
  InviteMemberSchema,
  RemoveMemberSchema,
  SuccessMessageResponse,
  TerritoryListResponse,
  TerritoryResponse,
  UpdateLocationSchema,
} from '../schemas/territory.schema.js'
import { RouteRegistrar } from '../utils/routeRegistrar.js'

export const registry = new OpenAPIRegistry()
const router = Router()
const registrar = new RouteRegistrar(registry, '/territories')

// All routes require authentication
router.use(authenticateToken)

// --- Territory CRUD ---

registrar.register(router, {
  method: 'post',
  path: '/',
  tags: ['Territory'],
  summary: 'Create a new territory',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: CreateTerritorySchema } },
    },
  },
  responses: {
    200: {
      description: 'Directory created',
      content: { 'application/json': { schema: TerritoryResponse } },
    },
  },
  handler: controller.create,
})

registrar.register(router, {
  method: 'get',
  path: '/mine',
  tags: ['Territory'],
  summary: 'List my territories',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'List of territories',
      content: { 'application/json': { schema: TerritoryListResponse } },
    },
  },
  handler: controller.listMyTerritories,
})

registrar.register(router, {
  method: 'delete',
  path: '/{id}',
  tags: ['Territory'],
  summary: 'Request delete territory',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Deletion requested',
      content: { 'application/json': { schema: SuccessMessageResponse } },
    },
  },
  handler: controller.requestDelete,
})

// --- Location & Logic ---

registrar.register(router, {
  method: 'put',
  path: '/{id}/location',
  tags: ['Territory'],
  summary: 'Update territory location (Claim/Resize/Move)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: { 'application/json': { schema: UpdateLocationSchema } },
    },
  },
  responses: {
    200: {
      description: 'Location updated',
      content: { 'application/json': { schema: SuccessMessageResponse } },
    },
  },
  handler: controller.updateLocation,
})

// --- Invitation System ---

registrar.register(router, {
  method: 'get',
  path: '/invitations/mine',
  tags: ['Territory'],
  summary: 'List my received invitations',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'List of invitations',
      content: { 'application/json': { schema: InvitationListResponse } },
    },
  },
  handler: controller.listMyInvitations,
})

registrar.register(router, {
  method: 'get',
  path: '/{id}/invitations',
  tags: ['Territory'],
  summary: 'List invitations for a territory',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'List of invitations',
      content: { 'application/json': { schema: InvitationListResponse } },
    },
  },
  handler: controller.listTerritoryInvitations,
})

registrar.register(router, {
  method: 'post',
  path: '/{id}/invite',
  tags: ['Territory'],
  summary: 'Invite a member to territory',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: { 'application/json': { schema: InviteMemberSchema } },
    },
  },
  responses: {
    200: {
      description: 'Invitation sent',
      content: { 'application/json': { schema: SuccessMessageResponse } },
    },
  },
  handler: controller.invite,
})

registrar.register(router, {
  method: 'post',
  path: '/invitations/{id}/accept',
  tags: ['Territory'],
  summary: 'Accept an invitation',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ description: 'Invitation ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Invitation accepted',
      content: { 'application/json': { schema: SuccessMessageResponse } },
    },
  },
  handler: controller.acceptInvite,
})

registrar.register(router, {
  method: 'delete',
  path: '/invitations/{id}',
  tags: ['Territory'],
  summary: 'Revoke or reject an invitation',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ description: 'Invitation ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Invitation revoked',
      content: { 'application/json': { schema: SuccessMessageResponse } },
    },
  },
  handler: controller.revokeInvite,
})

// --- Membership & Economy ---

registrar.register(router, {
  method: 'post',
  path: '/{id}/donate',
  tags: ['Territory'],
  summary: 'Donate personal credits to territory',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: { 'application/json': { schema: DonateSchema } },
    },
  },
  responses: {
    200: {
      description: 'Donation successful',
      content: { 'application/json': { schema: SuccessMessageResponse } },
    },
  },
  handler: controller.donate,
})

registrar.register(router, {
  method: 'delete',
  path: '/{id}/members',
  tags: ['Territory'],
  summary: 'Remove member (Kick or Leave)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: { 'application/json': { schema: RemoveMemberSchema } },
    },
  },
  responses: {
    200: {
      description: 'Member removed',
      content: {
        'application/json': {
          schema: SuccessMessageResponse.extend({
            refund: z.number(),
            deduction: z.number(),
          }),
        },
      },
    },
  },
  handler: controller.removeMember,
})

export default router

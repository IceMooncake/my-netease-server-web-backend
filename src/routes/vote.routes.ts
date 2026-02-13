// src/routes/vote.routes.ts
import { Router } from 'express'
import * as controller from '../controllers/vote.controller.js'
import { authenticateToken } from '../middlewares/auth.js'
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { RouteRegistrar } from '../utils/routeRegistrar.js'
import { CastVoteBody, SuccessResponse, VoteQuery, VoteListResponse } from '../schemas/vote.schema.js'

export const registry = new OpenAPIRegistry()
const router = Router()
const registrar = new RouteRegistrar(registry, '/votes')

router.use(authenticateToken)

registrar.register(router, {
  method: 'post',
  path: '/cast',
  tags: ['Vote'],
  summary: 'Cast a vote',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: CastVoteBody } },
    },
  },
  responses: {
    200: {
      description: 'Vote cast successfully',
      content: { 'application/json': { schema: SuccessResponse } },
    },
  },
  handler: controller.castVote,
})

registrar.register(router, {
    method: 'get',
    path: '/',
    tags: ['Vote'],
    summary: 'List votes',
    security: [{ bearerAuth: [] }],
    request: {
        query: VoteQuery
    },
    responses: {
        200: {
            description: 'List of votes',
            content: { 'application/json': { schema: VoteListResponse } },
        },
    },
    handler: controller.listVotes,
})

export default router

// src/routes/territories.routes.ts
import { Router } from 'express'
import { authenticateToken, requireAuth } from '../middlewares/auth.js'
import * as C from '../controllers/territory.controller.js'
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { RouteRegistrar } from '../utils/routeRegistrar.js'
import {
  ApplyBody,
  ApplyResponse,
  ContributeBody,
  ProposeSpendBody,
  ProposeJoinExpelBody,
  VoteBody,
  VoteParams,
  TerritoryIdParams,
} from '../schemas/territory.schema.js'
import { z } from 'zod'

export const registry = new OpenAPIRegistry()
const r = Router()
const registrar = new RouteRegistrar(registry, '/territories')

r.use(authenticateToken, requireAuth)

// 创建申请（需要你审批）
registrar.register(r, {
  method: 'post',
  path: '/apply',
  tags: ['Territories'],
  summary: 'Apply for a territory',
  request: {
    body: { content: { 'application/json': { schema: ApplyBody } } },
  },
  responses: {
    200: {
      description: 'Created',
      content: { 'application/json': { schema: ApplyResponse } },
    },
  },
  handler: C.apply,
})

// 领地公共池：捐献额度
registrar.register(r, {
  method: 'post',
  path: '/{id}/contribute',
  tags: ['Territories'],
  summary: 'Contribute credits',
  request: {
    params: TerritoryIdParams,
    body: { content: { 'application/json': { schema: ContributeBody } } },
  },
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.object({ success: z.boolean() }) } },
    },
  },
  handler: C.contribute,
})

// 提案：消费额度
registrar.register(r, {
  method: 'post',
  path: '/{id}/proposals/spend',
  tags: ['Proposals'],
  summary: 'Propose spending',
  request: {
    params: TerritoryIdParams,
    body: { content: { 'application/json': { schema: ProposeSpendBody } } },
  },
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.object({ proposalId: z.number() }) } },
    },
  },
  handler: C.proposeSpend,
})

// 提案：加人
registrar.register(r, {
  method: 'post',
  path: '/{id}/proposals/join',
  tags: ['Proposals'],
  summary: 'Propose joining',
  request: {
    params: TerritoryIdParams,
    body: { content: { 'application/json': { schema: ProposeJoinExpelBody } } },
  },
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.object({ proposalId: z.number() }) } },
    },
  },
  handler: C.proposeJoin,
})

// 提案：踢人
registrar.register(r, {
  method: 'post',
  path: '/{id}/proposals/expel',
  tags: ['Proposals'],
  summary: 'Propose expel',
  request: {
    params: TerritoryIdParams,
    body: { content: { 'application/json': { schema: ProposeJoinExpelBody } } },
  },
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.object({ proposalId: z.number() }) } },
    },
  },
  handler: C.proposeExpel,
})

// 对提案投票
registrar.register(r, {
  method: 'post',
  path: '/proposals/{proposalId}/vote',
  tags: ['Proposals'],
  summary: 'Vote on a proposal',
  request: {
    params: VoteParams,
    body: { content: { 'application/json': { schema: VoteBody } } },
  },
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.object({ success: z.boolean() }) } },
    },
  },
  handler: C.vote,
})

export default r

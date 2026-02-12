import 'dotenv/config'
import { z } from 'zod'
import fs from 'fs'
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'

import {
  RegisterBody,
  LoginBody,
  ConfirmRegisterBody,
} from '../src/schemas/auth.schema.js'

import {
  ListApplicationsQuery,
  DecideApplicationBody,
  DecideApplicationParams,
} from '../src/schemas/admin.schema.js'

import {
  ApplyBody,
  ContributeBody,
  ProposeSpendBody,
  ProposeJoinExpelBody,
  VoteBody,
  VoteParams,
  TerritoryIdParams,
} from '../src/schemas/territory.schema.js'

export default function () {
  // -----------------------------
  // 注册 OpenAPI
  // -----------------------------
  const registry = new OpenAPIRegistry()

  // -----------------------------
  // Auth APIs
  // -----------------------------
  registry.registerPath({
    method: 'post',
    path: '/auth/register',
    tags: ['Authentication'],
    summary: 'Register a new user',
    request: {
      body: {
        content: {
          'application/json': { schema: RegisterBody },
        },
      },
    },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              message: z.string(),
            }),
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/auth/login',
    tags: ['Authentication'],
    summary: 'Login user',
    request: {
      body: {
        content: {
          'application/json': { schema: LoginBody },
        },
      },
    },
    responses: {
      200: {
        description: 'Login result',
        content: {
          'application/json': {
            schema: z.object({
              msg: z.string(),
              qq: z.string(),
              token: z.string(),
            }),
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/auth/confirm-register',
    tags: ['Authentication'],
    summary: 'Confirm registration',
    request: {
      body: {
        content: {
          'application/json': { schema: ConfirmRegisterBody },
        },
      },
    },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: z.object({
              msg: z.string(),
              qq: z.string(),
            }),
          },
        },
      },
    },
  })

  // -----------------------------
  // Admin
  // -----------------------------
  registry.registerPath({
    method: 'get',
    path: '/admin/applications',
    tags: ['Admin'],
    summary: 'List territory applications',
    request: {
      query: ListApplicationsQuery,
    },
    responses: {
      200: {
        description: 'List',
        content: {
          'application/json': {
            schema: z.array(
              z.object({
                id: z.number(),
                status: ListApplicationsQuery.shape.status,
              })
            ),
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/admin/applications/{id}/decide',
    tags: ['Admin'],
    summary: 'Approve or reject application',
    request: {
      params: DecideApplicationParams,
      body: {
        content: {
          'application/json': { schema: DecideApplicationBody },
        },
      },
    },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': { schema: z.object({ success: z.boolean() }) },
        },
      },
    },
  })

  // -----------------------------
  // Territory APIs
  // -----------------------------
  registry.registerPath({
    method: 'post',
    path: '/territories/apply',
    tags: ['Territories'],
    summary: 'Apply for a territory',
    request: {
      body: {
        content: {
          'application/json': { schema: ApplyBody },
        },
      },
    },
    responses: {
      200: {
        description: 'Created',
        content: {
          'application/json': {
            schema: z.object({ applicationId: z.number() }),
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/territories/{id}/contribute',
    tags: ['Territories'],
    summary: 'Contribute credits',
    request: {
      params: TerritoryIdParams,
      body: { content: { 'application/json': { schema: ContributeBody } } },
    },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: z.object({ success: z.boolean() }),
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/territories/{id}/propose-spend',
    tags: ['Proposals'],
    summary: 'Propose spending',
    request: {
      params: TerritoryIdParams,
      body: { content: { 'application/json': { schema: ProposeSpendBody } } },
    },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: z.object({ proposalId: z.number() }),
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/territories/{id}/propose-join',
    tags: ['Proposals'],
    summary: 'Propose joining',
    request: {
      params: TerritoryIdParams,
      body: { content: { 'application/json': { schema: ProposeJoinExpelBody } } },
    },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: z.object({ proposalId: z.number() }),
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/territories/{id}/propose-expel',
    tags: ['Proposals'],
    summary: 'Propose expel',
    request: {
      params: TerritoryIdParams,
      body: { content: { 'application/json': { schema: ProposeJoinExpelBody } } },
    },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: z.object({ proposalId: z.number() }),
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/territories/proposals/{proposalId}/vote',
    tags: ['Proposals'],
    summary: 'Vote on a proposal',
    request: {
      params: VoteParams,
      body: {
        content: {
          'application/json': { schema: VoteBody },
        },
      },
    },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: z.object({ success: z.boolean() }),
          },
        },
      },
    },
  })

  // -----------------------------
  // 生成 openapi 文档
  // -----------------------------
  const generator = new OpenApiGeneratorV3(registry.definitions)

  const doc = generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Minecraft Territory API',
      version: '1.0.0',
    },
  })

  const basePath = process.env.OPEN_API_PATH || ''
  fs.writeFileSync(basePath + 'openapi.json', JSON.stringify(doc, null, 2))
  console.log('✅ OpenAPI document generated at ./openapi.json')
}

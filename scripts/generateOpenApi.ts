import 'dotenv/config'
import { z } from 'zod'
import fs from 'fs'
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'

import {
  RegisterBody,
  LoginBody,
  ConfirmRegisterBody,
} from '../src/schemas/auth.schema.ts'

import {
  ListApplicationsQuery,
  DecideApplicationBody,
  DecideApplicationParams,
} from '../src/schemas/admin.schema.ts'

import {
  ApplyBody,
  ContributeBody,
  ProposeSpendBody,
  ProposeJoinExpelBody,
  VoteBody,
  VoteParams,
  TerritoryIdParams,
} from '../src/schemas/territory.schema.ts'

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

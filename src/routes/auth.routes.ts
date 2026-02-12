// routes/authRoutes.ts
import express from 'express'
import {
  handleRegister,
  handleLogin,
  handleConfirmRegister,
  handleAuthorize,
  handleToken,
  handleRefreshToken,
} from '../controllers/auth.controller.js'
import { authenticateToken } from '../middlewares/auth.js'
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { RouteRegistrar } from '../utils/routeRegistrar.js'
import {
  RegisterBody,
  RegisterResponse,
  LoginBody,
  LoginResponse,
  ConfirmRegisterBody,
  ConfirmRegisterResponse,
  AuthorizeQuery,
  AuthorizeResponse,
  TokenBody,
  TokenResponse,
  RefreshTokenBody,
  RefreshTokenResponse,
} from '../schemas/auth.schema.js'

export const registry = new OpenAPIRegistry()
const router = express.Router()
const registrar = new RouteRegistrar(registry, '/api/auth')

registrar.register(router, {
  method: 'post',
  path: '/register',
  tags: ['Authentication'],
  summary: 'Register a new user',
  request: {
    body: {
      content: { 'application/json': { schema: RegisterBody } },
    },
  },
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: RegisterResponse } },
    },
  },
  handler: handleRegister,
})

registrar.register(router, {
  method: 'post',
  path: '/login',
  tags: ['Authentication'],
  summary: 'Login user',
  request: {
    body: {
      content: { 'application/json': { schema: LoginBody } },
    },
  },
  responses: {
    200: {
      description: 'Login result',
      content: { 'application/json': { schema: LoginResponse } },
    },
  },
  handler: handleLogin,
})

registrar.register(router, {
  method: 'post',
  path: '/confirm-register',
  tags: ['Authentication'],
  summary: 'Confirm registration',
  request: {
    body: {
      content: { 'application/json': { schema: ConfirmRegisterBody } },
    },
  },
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: ConfirmRegisterResponse } },
    },
  },
  handler: handleConfirmRegister,
})

registrar.register(router, {
  method: 'get',
  path: '/authorize',
  tags: ['OAuth2'],
  summary: 'OAuth2 Authorize Endpoint',
  request: {
    query: AuthorizeQuery,
  },
  responses: {
    200: {
      description: 'Authorization Code',
      content: { 'application/json': { schema: AuthorizeResponse } },
    },
  },
  handler: [authenticateToken, handleAuthorize] as any, // Cast because RouteConfig expects single handler but express supports array
})

registrar.register(router, {
  method: 'post',
  path: '/token',
  tags: ['OAuth2'],
  summary: 'OAuth2 Token Endpoint',
  request: {
    body: {
      content: { 'application/json': { schema: TokenBody } },
    },
  },
  responses: {
    200: {
      description: 'Access Token',
      content: { 'application/json': { schema: TokenResponse } },
    },
  },
  handler: handleToken,
})

registrar.register(router, {
  method: 'post',
  path: '/refresh',
  tags: ['Authentication'],
  summary: 'Refresh Access Token',
  request: {
    body: {
      content: { 'application/json': { schema: RefreshTokenBody } },
    },
  },
  responses: {
    200: {
      description: 'New Access Token',
      content: { 'application/json': { schema: RefreshTokenResponse } },
    },
  },
  handler: handleRefreshToken,
})

export default router

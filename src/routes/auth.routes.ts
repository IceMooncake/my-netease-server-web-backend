// src/routes/auth.routes.ts
import { Router } from 'express'
import * as controller from '../controllers/auth.controller.js'
import * as userController from '../controllers/user.controller.js'
import { authenticateToken } from '../middlewares/auth.js'
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { RouteRegistrar } from '../utils/routeRegistrar.js'
import {
  RegisterBody,
  RegisterResponse,
  LoginBody,
  LoginResponse,
  AuthorizeQuery,
  AuthorizeResponse,
  TokenBody,
  TokenResponse,
  RefreshTokenBody,
  RefreshTokenResponse,
  UserProfileResponse
} from '../schemas/auth.schema.js'

export const registry = new OpenAPIRegistry()
const router = Router()
const registrar = new RouteRegistrar(registry, '/auth')

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
  handler: controller.handleRegister,
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
  handler: controller.handleLogin,
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
  handler: [authenticateToken, controller.handleAuthorize] as any,
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
  handler: controller.handleToken,
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
  handler: controller.handleRefreshToken,
})

registrar.register(router, {
  method: 'get',
  path: '/me',
  tags: ['Authentication', 'User'],
  summary: 'Get current user profile',
  responses: {
    200: {
      description: 'User profile',
      content: { 'application/json': { schema: UserProfileResponse } },
    },
  },
  handler: [authenticateToken, userController.getMe] as any,
})

export default router

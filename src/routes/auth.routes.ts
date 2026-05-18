// src/routes/auth.routes.ts
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { Router } from 'express'
import { z } from 'zod'
import * as controller from '../controllers/auth.controller.js'
import * as userController from '../controllers/user.controller.js'
import { authenticateToken } from '../middlewares/auth.js'
import { loginLimiter } from '../middlewares/security.js'
import {
  AuthorizeQuery,
  AuthorizeResponse,
  LoginBody,
  LoginResponse,
  RefreshTokenBody,
  RefreshTokenResponse,
  RegisterBody,
  RegisterResponse,
  TokenBody,
  TokenResponse,
  UpdateNicknameBody,
  UserProfileResponse,
} from '../schemas/auth.schema.js'
import { RouteRegistrar } from '../utils/routeRegistrar.js'

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
  handler: [loginLimiter, controller.handleLogin],
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

registrar.register(router, {
  method: 'patch',
  path: '/me/nickname',
  tags: ['Authentication', 'User'],
  summary: 'Update user nickname',
  request: {
    body: {
      content: { 'application/json': { schema: UpdateNicknameBody } },
    },
  },
  responses: {
    200: {
      description: 'Nickname updated',
      content: { 'application/json': { schema: z.object({ message: z.string() }) } },
    },
  },
  handler: [authenticateToken, userController.updateNickname] as any,
})

export default router

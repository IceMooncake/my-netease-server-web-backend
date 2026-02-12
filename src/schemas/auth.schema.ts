// import zod and inject openapi tool
import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
extendZodWithOpenApi(z)

// 注册请求体
export const RegisterBody = z.object({
  qq: z.string().min(3, 'qq长度至少3位'),
  password: z.string().min(6, '密码长度至少6位'),
})

// 注册返回值
export const RegisterResponse = z.object({
  success: z.boolean(),
  message: z.string(),
})

// 登录请求体
export const LoginBody = z.object({
  qq: z.string().min(3),
  password: z.string().min(6),
})

// 登录返回值
export const LoginResponse = z.object({
  qq: z.string(),
  msg: z.string(),
  token: z.string(),
})

// 确认注册请求体
export const ConfirmRegisterBody = z.object({
  qq: z.string().min(3),
})

// 确认注册返回值
export const ConfirmRegisterResponse = z.object({
  qq: z.string(),
  msg: z.string(),
})

// OAuth2 Authorize Request
export const AuthorizeQuery = z.object({
  client_id: z.string(),
  redirect_uri: z.string().url(),
  response_type: z.enum(['code']),
  state: z.string().optional(),
})

// OAuth2 Authorize Response
export const AuthorizeResponse = z.object({
  code: z.string(),
  redirect_uri: z.string(),
  state: z.string().optional(),
})

// OAuth2 Token Request
export const TokenBody = z.object({
  grant_type: z.enum(['authorization_code']),
  code: z.string(),
  redirect_uri: z.string().url(),
  client_id: z.string(),
  client_secret: z.string().optional(),
})

// OAuth2 Token Response
export const TokenResponse = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  refresh_token: z.string(),
})

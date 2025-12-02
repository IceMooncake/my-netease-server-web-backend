// import zod and inject openapi tool
import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
extendZodWithOpenApi(z)

// 注册请求体
export const RegisterBodySchema = z.object({
  qq: z.string().min(3, 'qq长度至少3位'),
  password: z.string().min(6, '密码长度至少6位'),
})

// 登录请求体
export const LoginBodySchema = z.object({
  qq: z.string().min(3),
  password: z.string().min(6),
})

// 确认注册请求体
export const ConfirmRegisterBodySchema = z.object({
  qq: z.string().min(3),
})

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

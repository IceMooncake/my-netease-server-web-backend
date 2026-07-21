import type { CreateExpressContextOptions } from '@trpc/server/adapters/express'
import jwt from 'jsonwebtoken'
import prisma from '../database/prisma.js'

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret'

export interface AuthUser {
  qq: string
}

/**
 * 从请求中提取用户信息（JWT 验证）
 */
function extractUser(req: CreateExpressContextOptions['req']): AuthUser | null {
  const token = req.cookies?.access_token as string | undefined
  if (!token) return null
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser
    return decoded
  } catch {
    return null
  }
}

/**
 * 创建 tRPC 上下文
 * 每个请求都会调用此函数
 */
export async function createContext({ req, res }: CreateExpressContextOptions) {
  const user = extractUser(req)
  return {
    prisma,
    user,
    req,
    res,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>

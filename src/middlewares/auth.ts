// src/middlewares/auth.ts
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../database/prisma.js'

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret'

export interface AuthUser {
  qq: string
}

declare global {
  namespace Express {
    interface Request {
      user: AuthUser
    }
  }
}

/** 验证 JWT 并挂载 user 到 req.user */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  // 如果没有，从cookie获取
  const token = req.cookies.access_token as string | undefined
  if (!token) return res.status(401).json({ message: '未登录' })
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: '无效或过期的 Token' })
    req.user = decoded as AuthUser
    next()
  })
}

/** 必须登录才能访问 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.qq) return res.status(401).json({ message: '未登录' })
  next()
}

/** 必须是管理员 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.qq) return res.status(401).json({ message: '未登录' })
  
  try {
    const user = await prisma.users.findUnique({
      where: { qq: req.user.qq },
      select: { is_admin: true }
    })
    
    if (!user || user.is_admin !== 1) {
      return res.status(403).json({ message: '需要管理员权限' })
    }
    
    next()
  } catch (error) {
    console.error('检查管理员权限失败:', error)
    return res.status(500).json({ message: '服务器错误' })
  }
}

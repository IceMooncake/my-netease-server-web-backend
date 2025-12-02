// src/middlewares/auth.ts
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret'

export interface AuthUser {
  qq: string
  isAdmin?: boolean
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

/** 验证 JWT 并挂载 user 到 req.user */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer <token>
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
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.isAdmin) return res.status(403).json({ message: '需要管理员权限' })
  next()
}

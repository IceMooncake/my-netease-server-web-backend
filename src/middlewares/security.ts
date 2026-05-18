import { NextFunction, Request, Response } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'

// 通用限流：每个 IP 每 1 分钟最多 100 次请求
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 100,
  message: '请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
})

// 登录接口专用限流：每个 IP 每 10 分钟最多 10 次
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 分钟
  max: 10,
  message: '登录尝试过多，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
})

// Helmet 安全头
export const securityHeaders = helmet()

// 统一异常处理
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err.status) {
    res.status(err.status).json({ message: err.message })
  } else {
    res.status(500).json({ message: '服务器内部错误' })
  }
}

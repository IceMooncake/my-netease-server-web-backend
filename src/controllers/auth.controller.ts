// controllers/authController.ts
import { Request, Response } from 'express'
import {
  AuthorizeQuery,
  AuthorizeResponse,
  LoginBody,
  LoginResponse,
  RegisterBody,
  RegisterResponse,
  TokenBody,
  TokenResponse,
} from '../schemas/auth.schema.js'
import { authService } from '../services/index.js'
import { handleAsync } from '../utils/handleAsync.js'

export async function handleRegister(req: Request, res: Response) {
  handleAsync(
    res,
    async () => {
      const { qq, password, nick_name } = RegisterBody.parse(req.body)
      return await authService.register(qq, password, nick_name || `用户${qq}`)
    },
    { response: RegisterResponse }
  )
}

export async function handleLogin(req: Request, res: Response) {
  handleAsync(
    res,
    async () => {
      const { qq, password } = LoginBody.parse(req.body)
      const tokenData = await authService.login(qq, password)

      // 设置响应头存储token到浏览器
      const isProduction = process.env.NODE_ENV === 'production' && req.protocol === 'https';
      res.setHeader('Set-Cookie', [
        `access_token=${tokenData.access_token}; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=${isProduction ? 'None' : 'Lax'}; Max-Age=${tokenData.expires_in}; Path=/api`,
        `refresh_token=${tokenData.refresh_token}; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=${isProduction ? 'None' : 'Lax'}; Max-Age=${30 * 24 * 3600}; Path=/api`,
      ])

      return { msg: '登录成功', qq, ...tokenData }
    },
    { response: LoginResponse, errorCode: 401 }
  )
}

export async function handleAuthorize(req: Request, res: Response) {
  handleAsync(
    res,
    async () => {
      // @ts-ignore
      const userQQ = req.user.qq
      const { client_id, redirect_uri, response_type, state } = AuthorizeQuery.parse(req.query)
      const result = await authService.authorize(
        userQQ,
        client_id,
        redirect_uri,
        response_type,
        state
      )
      return {
        code: result.code,
        redirect_uri: result.redirectUri,
        state: result.state,
      }
    },
    { response: AuthorizeResponse }
  )
}

export async function handleToken(req: Request, res: Response) {
  handleAsync(
    res,
    async () => {
      const { grant_type, code, redirect_uri, client_id, client_secret } = TokenBody.parse(req.body)
      return await authService.token(grant_type, code, redirect_uri, client_id, client_secret)
    },
    { response: TokenResponse }
  )
}

export async function handleRefreshToken(req: Request, res: Response) {
  handleAsync(
    res,
    async () => {
      const { refresh_token } = req.cookies
      if (!refresh_token) {
        throw new Error('需要刷新认证令牌')
      }
      const tokenData = await authService.refreshToken(refresh_token)

      // 更新响应头中的cookies
      const isProduction = process.env.NODE_ENV === 'production'
      res.setHeader('Set-Cookie', [
        `access_token=${tokenData.access_token}; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=${isProduction ? 'None' : 'Lax'}; Max-Age=${tokenData.expires_in}; Path=/api`,
        `refresh_token=${tokenData.refresh_token}; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=${isProduction ? 'None' : 'Lax'}; Max-Age=${30 * 24 * 3600}; Path=/api`,
      ])

      return tokenData
    },
    { response: TokenResponse }
  )
}

// controllers/authController.ts
import { Request, Response } from 'express'
import { handleAsync } from '../utils/handleAsync.js'
import { authService } from '../services/index.js'
import {
  RegisterBody,
  LoginBody,
  ConfirmRegisterBody,
  RegisterResponse,
  LoginResponse,
  ConfirmRegisterResponse,
  AuthorizeQuery,
  AuthorizeResponse,
  TokenBody,
  TokenResponse,
} from '../schemas/auth.schema.js'

export async function handleRegister(req: Request, res: Response) {
  handleAsync(
    res,
    async () => {
      const { qq, password } = RegisterBody.parse(req.body)
      return await authService.register(qq, password)
    },
    { response: RegisterResponse }
  )
}

export async function handleConfirmRegister(req: Request, res: Response) {
  handleAsync(
    res,
    async () => {
      const { qq } = ConfirmRegisterBody.parse(req.body)
      await authService.confirmRegister(qq)
      return { msg: '注册成功', qq }
    },
    { response: ConfirmRegisterResponse }
  )
}

export async function handleLogin(req: Request, res: Response) {
  handleAsync(
    res,
    async () => {
      const { qq, password } = LoginBody.parse(req.body)
      const tokenData = await authService.login(qq, password)
      
      // 设置响应头存储token到浏览器
      res.setHeader('Set-Cookie', [
        `access_token=${tokenData.access_token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${tokenData.expires_in}`,
        `refresh_token=${tokenData.refresh_token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${30 * 24 * 3600}`
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
      const { refresh_token } = req.body
      if (!refresh_token) {
        throw new Error('Refresh token required')
      }
      const tokenData = await authService.refreshToken(refresh_token)
      
      // 更新响应头中的cookies
      res.setHeader('Set-Cookie', [
        `access_token=${tokenData.access_token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${tokenData.expires_in}`,
        `refresh_token=${tokenData.refresh_token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${30 * 24 * 3600}`
      ])
      
      return tokenData
    },
    { response: TokenResponse }
  )
}
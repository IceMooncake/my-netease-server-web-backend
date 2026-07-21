import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { authService } from '../../services/index.js'
import { protectedProcedure, publicProcedure, router } from '../trpc.js'

// ── Zod Schemas ──────────────────────────────────────────

const RegisterInput = z.object({
  qq: z.string().min(3).max(20),
  password: z.string().min(6).max(100),
  nick_name: z.string().min(1).max(20).optional(),
})

const LoginInput = z.object({
  qq: z.string().min(3),
  password: z.string().min(6),
})

const AuthorizeQuery = z.object({
  client_id: z.string(),
  redirect_uri: z.string().url(),
  response_type: z.enum(['code']),
  state: z.string().optional(),
})

const TokenInput = z.object({
  grant_type: z.enum(['authorization_code']),
  code: z.string(),
  redirect_uri: z.string().url(),
  client_id: z.string(),
  client_secret: z.string().optional(),
})

// ── Router ───────────────────────────────────────────────

export const authRouter = router({
  /**
   * 注册新用户
   */
  register: publicProcedure.input(RegisterInput).mutation(async ({ input }) => {
    const result = await authService.register(
      input.qq,
      input.password,
      input.nick_name || `用户${input.qq}`
    )
    return result
  }),

  /**
   * 登录
   */
  login: publicProcedure.input(LoginInput).mutation(async ({ input, ctx }) => {
    const tokenData = await authService.login(input.qq, input.password)

    // 设置 Cookie
    const isProduction = process.env.NODE_ENV === 'production'
    ctx.res.setHeader('Set-Cookie', [
      `access_token=${tokenData.access_token}; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=${isProduction ? 'Strict' : 'Lax'}; Max-Age=${tokenData.expires_in}; Path=/api`,
      `refresh_token=${tokenData.refresh_token}; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=${isProduction ? 'Strict' : 'Lax'}; Max-Age=${30 * 24 * 3600}; Path=/api`,
    ])

    return { msg: '登录成功', qq: input.qq, ...tokenData }
  }),

  /**
   * OAuth2 授权端点
   */
  authorize: protectedProcedure.input(AuthorizeQuery).query(async ({ input, ctx }) => {
    const result = await authService.authorize(
      ctx.user.qq,
      input.client_id,
      input.redirect_uri,
      input.response_type,
      input.state
    )
    return {
      code: result.code,
      redirect_uri: result.redirectUri,
      state: result.state,
    }
  }),

  /**
   * OAuth2 Token 端点
   */
  token: publicProcedure.input(TokenInput).mutation(async ({ input }) => {
    return await authService.token(
      input.grant_type,
      input.code,
      input.redirect_uri,
      input.client_id,
      input.client_secret
    )
  }),

  /**
   * 刷新 Token
   */
  refreshToken: publicProcedure.mutation(async ({ ctx }) => {
    const refreshToken = ctx.req.cookies?.refresh_token as string | undefined
    if (!refreshToken) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: '需要刷新认证令牌' })
    }
    const tokenData = await authService.refreshToken(refreshToken)

    const isProduction = process.env.NODE_ENV === 'production'
    ctx.res.setHeader('Set-Cookie', [
      `access_token=${tokenData.access_token}; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=${isProduction ? 'None' : 'Lax'}; Max-Age=${tokenData.expires_in}; Path=/api`,
      `refresh_token=${tokenData.refresh_token}; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=${isProduction ? 'None' : 'Lax'}; Max-Age=${30 * 24 * 3600}; Path=/api`,
    ])

    return tokenData
  }),
})

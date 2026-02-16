import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import prisma from '../../database/prisma.js'
import { comparePassword } from '../../utils/hash.js'
import otpService from '../sms/sms.service.js'

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret'

const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('base64url')
}

const ensureOAuthClient = async () => {
  const clientId = 'ice_town_web'
  const existingClient = await prisma.oauth_clients.findUnique({
    where: { client_id: clientId },
  })
  if (!existingClient) {
    await prisma.oauth_clients.create({
      data: {
        client_id: clientId,
        client_secret: 'default_secret', // In production, use a secure secret
        redirect_uri: 'http://localhost:5173/callback', // Adjust as needed
        grant_types: 'authorization_code refresh_token',
        scope: 'read write',
      },
    })
  }
}

const register = async (qq: string, password: string, nick_name: string) => {
  // 检查用户是否在指定的群组中
  const isInGroup = await prisma.group_members.findUnique({
    where: { qq },
  })
  if (!isInGroup) throw new Error('用户不在群中')
  // 已存在用户
  const existingUser = await prisma.users.findUnique({
    where: { qq },
  })
  if (existingUser) throw new Error('用户已存在')
  // 生成或返回已有验证码
  const code = await otpService.generateCode(qq, password, nick_name) // username 即 QQ 号
  // 返回验证码
  return {
    success: false,
    code,
  }
}

async function login(qq: string, password: string) {
  const user = await prisma.users.findUnique({
    where: { qq },
  })
  if (!user) throw new Error('用户名或密码错误') // 用户不存在(不透明错误)
  const isMatch = await comparePassword(password, user.password) // ✅ 使用 bcrypt 比对密码
  if (!isMatch) throw new Error('用户名或密码错误')

  // 确保 OAuth 客户端存在
  await ensureOAuthClient()

  // 生成 access token (1小时有效)
  const accessToken = jwt.sign(
    {
      qq: user.qq,
      type: 'access',
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  )

  // 生成 refresh token (30天有效)
  const refreshToken = generateSecureToken()

  // 存储 tokens 到数据库
  await prisma.oauth_access_tokens.create({
    data: {
      access_token: accessToken,
      client_id: 'ice_town_web', // 默认客户端ID
      user_qq: user.qq,
      expires_at: new Date(Date.now() + 3600 * 1000), // 1小时
      scope: 'read write',
    },
  })

  await prisma.oauth_refresh_tokens.create({
    data: {
      refresh_token: refreshToken,
      access_token: accessToken,
      client_id: 'ice_town_web',
      user_qq: user.qq,
      expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000), // 30天
      scope: 'read write',
    },
  })

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: refreshToken,
    scope: 'read write',
  }
}

async function authorize(
  userQQ: string,
  clientId: string,
  redirectUri: string,
  responseType: string,
  state?: string
) {
  if (responseType !== 'code') {
    throw new Error('不支持的响应类型')
  }

  const client = await prisma.oauth_clients.findUnique({
    where: { client_id: clientId },
  })

  if (!client) {
    throw new Error('无效的客户端ID')
  }

  // Generate code
  const code = generateSecureToken(16) // Shorter for authorization code

  // Store code
  await prisma.oauth_authorization_codes.create({
    data: {
      authorization_code: code,
      redirect_uri: redirectUri,
      client_id: clientId,
      user_qq: userQQ,
      expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
    },
  })

  return { code, redirectUri, state }
}

async function token(
  grantType: string,
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret?: string
) {
  if (grantType !== 'authorization_code') {
    throw new Error('不支持的授权类型')
  }

  const authCode = await prisma.oauth_authorization_codes.findUnique({
    where: { authorization_code: code },
    include: { client: true },
  })

  if (!authCode) {
    throw new Error('无效的授权码')
  }

  if (authCode.expires_at && authCode.expires_at < new Date()) {
    throw new Error('授权码已过期')
  }

  if (authCode.client_id !== clientId) {
    throw new Error('无效的客户端ID')
  }

  // Generate access token (JWT)
  const accessToken = jwt.sign(
    {
      qq: authCode.user_qq,
      clientId: clientId,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  )

  // Generate refresh token
  const refreshToken = generateSecureToken()

  // Store tokens (Wait, verify user exists first?)
  // Assuming user exists because code exists

  await prisma.oauth_access_tokens.create({
    data: {
      access_token: accessToken,
      client_id: clientId,
      user_qq: authCode.user_qq,
      expires_at: new Date(Date.now() + 3600 * 1000),
      scope: authCode.scope,
    },
  })

  await prisma.oauth_refresh_tokens.create({
    data: {
      refresh_token: refreshToken,
      access_token: accessToken,
      client_id: clientId,
      user_qq: authCode.user_qq,
      expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000), // 30 days
      scope: authCode.scope,
    },
  })

  // Delete used code
  await prisma.oauth_authorization_codes.delete({
    where: { authorization_code: code },
  })

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: refreshToken,
  }
}

async function refreshToken(refreshToken: string) {
  // 查找refresh token
  const refreshTokenRecord = await prisma.oauth_refresh_tokens.findUnique({
    where: { refresh_token: refreshToken },
    include: { user: true },
  })

  if (!refreshTokenRecord) {
    throw new Error('无效的刷新令牌')
  }

  if (refreshTokenRecord.expires_at && refreshTokenRecord.expires_at < new Date()) {
    throw new Error('刷新令牌已过期')
  }

  const user = refreshTokenRecord.user

  // 生成新的access token
  const newAccessToken = jwt.sign(
    {
      qq: user.qq,
      type: 'access',
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  )

  // 删除旧的access token
  await prisma.oauth_access_tokens.delete({
    where: { access_token: refreshTokenRecord.access_token },
  })

  // 生成新的refresh token
  const newRefreshToken = generateSecureToken()

  // 存储新的tokens
  await prisma.oauth_access_tokens.create({
    data: {
      access_token: newAccessToken,
      client_id: refreshTokenRecord.client_id,
      user_qq: user.qq,
      expires_at: new Date(Date.now() + 3600 * 1000),
      scope: refreshTokenRecord.scope,
    },
  })

  await prisma.oauth_refresh_tokens.update({
    where: { refresh_token: refreshToken },
    data: {
      refresh_token: newRefreshToken,
      access_token: newAccessToken,
      expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    },
  })

  return {
    access_token: newAccessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: newRefreshToken,
    scope: refreshTokenRecord.scope,
  }
}

export default {
  register,
  login,
  authorize,
  token,
  refreshToken,
}

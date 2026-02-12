import jwt from 'jsonwebtoken'
import { comparePassword } from '../../utils/hash.js'
import otpService from '../sms/sms.service.js'
import prisma from '../../database/prisma.js'

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret'
const JWT_EXPIRES_IN = '7d' // 7天有效

const register = async (qq: string, password: string) => {
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
  const code = await otpService.generateCode(qq, password) // username 即 QQ 号
  // 返回提示信息
  return {
    success: false,
    message: `请在群中发送验证码：${code}，5分钟内有效`,
  }
}

async function confirmRegister(qq: string) {
  const password = await otpService.checkIsVerified(qq)
  await prisma.users.create({
    data: { qq, password: password },
  })
  return qq
}

async function login(qq: string, password: string) {
  const user = await prisma.users.findUnique({
    where: { qq },
  })
  if (!user) throw new Error('用户名或密码错误') // 用户不存在(不透明错误)
  const isMatch = await comparePassword(password, user.password) // ✅ 使用 bcrypt 比对密码
  if (!isMatch) throw new Error('用户名或密码错误')
  const token = jwt.sign(
    {
      qq: user.qq,
      isAdmin: user.is_admin,
    }, // payload
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
  return token
}

async function authorize(
  userQQ: string,
  clientId: string,
  redirectUri: string,
  responseType: string,
  state?: string
) {
  if (responseType !== 'code') {
    throw new Error('Unsupported response_type')
  }

  const client = await prisma.oauth_clients.findUnique({
    where: { client_id: clientId },
  })

  if (!client) {
    throw new Error('Invalid client_id')
  }

  // Generate code
  const code = Math.random().toString(36).substring(2, 15)

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
    throw new Error('Unsupported grant_type')
  }

  const authCode = await prisma.oauth_authorization_codes.findUnique({
    where: { authorization_code: code },
    include: { client: true },
  })

  if (!authCode) {
    throw new Error('Invalid authorization code')
  }

  if (authCode.expires_at && authCode.expires_at < new Date()) {
    throw new Error('Authorization code expired')
  }

  if (authCode.client_id !== clientId) {
    throw new Error('Invalid client_id')
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
  const refreshToken =
    Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)

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

export default {
  register,
  confirmRegister,
  login,
  authorize,
  token,
}

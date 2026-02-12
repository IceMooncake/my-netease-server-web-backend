import prisma from '../../database/prisma.js'
import { hashPassword } from '../../utils/hash.js'

// 创建或更新验证码
async function createVerificationCode(qq: string, password: string): Promise<string> {
  // 查找现有验证码
  const existingCode = await prisma.verification_codes.findFirst({
    where: { qq },
    orderBy: { expires_at: 'desc' },
  })

  const now = new Date()

  if (!existingCode || existingCode.expires_at < now) {
    // 如果存在旧验证码且已过期，删除它
    if (existingCode) {
      await prisma.verification_codes.delete({ where: { qq: existingCode.qq } })
    }

    // 生成新验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5分钟后过期
    const hashedPassword = await hashPassword(password)

    // 插入新验证码
    await prisma.verification_codes.create({
      data: {
        qq,
        code,
        expires_at: expiresAt,
        password: hashedPassword,
        verified: false,
      },
    })

    return code
  }

  // 如果现有验证码未过期，直接返回
  return existingCode.code
}

// 生成验证码并保存到数据库
async function generateCode(qq: string, password: string) {
  return await createVerificationCode(qq.toString(), password)
}

// 检查验证码是否已验证
async function checkIsVerified(qq: string) {
  const row = await prisma.verification_codes.findFirst({
    where: { qq },
  })

  if (!row || !row.verified) {
    throw new Error('验证码无效')
  }
  await prisma.verification_codes.deleteMany({
    where: { qq },
  }) // 验证成功删除验证码记录
  return row.password // 返回已验证状态
}

export default { generateCode, checkIsVerified }

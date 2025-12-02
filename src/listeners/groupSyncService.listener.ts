import prisma from '../database/prisma.ts'
import napcatService from '../services/napcat.service.ts'

const { napcat } = napcatService
const groupId = Number(process.env.NAPCAT_GROUPID)

// -----------------工具-----------------

const verifyCode = async (qq: string, code: string): Promise<boolean> => {
  // 查询未验证的验证码
  const verificationCode = await prisma.verification_codes.findFirst({
    where: { qq, code, verified: false },
  })
  if (!verificationCode) return false
  // 检查是否过期
  if (verificationCode.expires_at < new Date()) {
    throw new Error('验证码已过期')
  }
  // 标记为已验证
  await prisma.verification_codes.update({
    where: { qq: verificationCode.qq },
    data: { verified: true },
  })
  return true
}

// ---------------监听群事件---------------

console.log(`👀 正在监听群 ${groupId} 的成员变动...`)

napcat.on('notice.group_increase', async ctx => {
  console.log(`✅ 新成员加入：${ctx.user_id}`)
  await prisma.group_members.upsert({
    where: { qq: ctx.user_id.toString() },
    update: {
      status: 1,
      updated_at: new Date(),
    },
    create: {
      qq: ctx.user_id.toString(),
      status: 1,
    },
  })
})

napcat.on('notice.group_decrease', async ctx => {
  console.log(`❌ 成员退出：${ctx.user_id}`)
  await prisma.group_members.update({
    where: { qq: ctx.user_id.toString() },
    data: { status: 0, updated_at: new Date() },
  })
})

// 监听群消息，检查是否有验证码
napcat.on('message.group.normal', async ctx => {
  if (ctx.group_id !== groupId) return
  const code = ctx.raw_message.trim()
  const qq = ctx.user_id.toString()
  // 验证成功，标记为已验证
  const access = await verifyCode(qq, code)
  if (access) {
    console.log(`✅ QQ ${qq} 验证码 ${code} 验证通过`)
  }
})

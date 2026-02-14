import prisma from '../database/prisma.js'
import { napcatService, creditService } from '../services/index.js'

// -----------------工具-----------------

const verifyCode = async (qq: string, code: string): Promise<{ success: boolean, password?: string | null }> => {
  // 查询未验证的验证码
  const verificationCode = await prisma.verification_codes.findFirst({
    where: { qq, code, verified: false },
  })
  if (!verificationCode) return { success: false }
  // 检查是否过期
  if (verificationCode.expires_at < new Date()) {
    throw new Error('验证码已过期')
  }
  // 标记为已验证
  await prisma.verification_codes.update({
    where: { qq: verificationCode.qq },
    data: { verified: true },
  })
  return { success: true, password: verificationCode.password }
}

// ---------------监听群事件---------------
const { napcat } = napcatService
const groupId = Number(process.env.NAPCAT_GROUPID)

export default function () {
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
    const qq = ctx.user_id.toString()
    await prisma.group_members.update({
      where: { qq },
      data: { status: 0, updated_at: new Date() },
    })
    
    // New: Freeze user
    try {
      await prisma.users.update({
          where: { qq },
          data: { 
              status: 'FROZEN', 
              left_group_at: new Date() 
          }
      })
    } catch(e) {
      // User might not exist in users table
    }
  })

  // 监听群消息，检查是否有验证码
  napcat.on('message.group.normal', async ctx => {
    if (ctx.group_id !== groupId) return

    const qq = ctx.user_id.toString()
    
    // 每日签到逻辑
    try {
      if (await creditService.checkIn(qq)) {
         console.log(`✅ QQ ${qq} 每日签到成功`)
      }
    } catch (error) {
       // Ignore errors (user not found etc)
    }

    const code = ctx.raw_message.trim()
    // 验证成功，标记为已验证并创建用户
    const result = await verifyCode(qq, code)
    if (result.success && result.password) {
      console.log(`✅ QQ ${qq} 验证码 ${code} 验证通过`)
      try {
        // 直接创建用户
        await prisma.users.create({
          data: { qq, password: result.password },
        })
        console.log(`✅ QQ ${qq} 用户创建成功`)
        // 通过 WebSocket 推送注册成功事件
        if (global.io) {
          global.io.emit('registration_success', { qq, success: true })
        }
      } catch (error) {
        console.error(`❌ QQ ${qq} 用户创建失败:`, error)
        // 推送失败事件
        if (global.io) {
          global.io.emit('registration_success', { qq, success: false, message: '注册失败' })
        }
      }
    }
  })
}

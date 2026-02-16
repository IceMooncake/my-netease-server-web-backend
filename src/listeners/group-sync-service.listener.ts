import prisma from '../database/prisma.js';
import { creditService, napcatService } from '../services/index.js';

// -----------------工具-----------------

const verifyCode = async (
  qq: string,
  code: string
): Promise<{ success: boolean; password?: string | null; nick_name?: string | null }> => {
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
  return { success: true, password: verificationCode.password, nick_name: verificationCode.nick_name }
}

// ---------------监听群事件---------------
const { napcat } = napcatService
const groupId = Number(process.env.NAPCAT_GROUPID)

const CUTOFF_2026_03_01 = new Date('2026-03-01T00:00:00+08:00')
const CUTOFF_2026_02_16 = new Date('2026-02-16T00:00:00+08:00')

function getInitialCredits(joinTime: Date): number {
  if (joinTime < CUTOFF_2026_02_16) {
    return 2666
  }
  if (joinTime < CUTOFF_2026_03_01) {
    return 888
  }
  return 0
}

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

    // New: Unfreeze user if they rejoin
    try {
      await prisma.users.update({
        where: { qq: ctx.user_id.toString() },
        data: {
          status: 'ACTIVE',
          left_group_at: null,
        },
      })
    } catch (e) {
      // User might not exist in users table, ignore
    }
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
          left_group_at: new Date(),
        },
      })
    } catch (e) {
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
      }
    } catch {}

    const code = ctx.raw_message.trim()
    // 验证成功，标记为已验证并创建用户
    const result = await verifyCode(qq, code)
    if (result.success && result.password && result.nick_name) {
      try {
        // 直接创建用户
        const userInfo = await napcat.get_group_member_info({
          group_id: groupId,
          user_id: ctx.user_id,
        })
        const joinTime = userInfo.join_time ? new Date(userInfo.join_time * 1000) : new Date() // Fallback to now if join_time is missing
        const personalCredits = getInitialCredits(joinTime)
        await prisma.users.create({
          data: {
            qq,
            password: result.password,
            nick_name: result.nick_name,
            personal_credits: personalCredits,
          },
        })
        napcat.send_group_msg({
          group_id: groupId,
          message: [
            {
              type: 'at',
              data: {
                qq,
              },
            },
            {
              type: 'text',
              data: {
                text: ' 成功创建账号！快去登录吧！OvO',
              },
            },
          ],
        })
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

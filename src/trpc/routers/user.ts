import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { AdminTaskType } from '../../generated/prisma/enums.js'
import { protectedProcedure, router } from '../trpc.js'

// ── Zod Schemas ──────────────────────────────────────────

const UpdateNicknameInput = z.object({
  nick_name: z.string().min(1, '昵称不能为空').max(20, '昵称长度不能超过20位'),
})

// ── Router ───────────────────────────────────────────────

export const userRouter = router({
  /**
   * 获取当前用户信息
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.users.findUnique({
      where: { qq: ctx.user.qq },
    })
    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '用户未找到' })
    }

    let nextUpdate: string | null = null
    if (user.last_nickname_update) {
      const lastUpdate = new Date(user.last_nickname_update)
      const nextTime = lastUpdate.getTime() + 30 * 24 * 60 * 60 * 1000
      if (nextTime > Date.now()) {
        nextUpdate = new Date(nextTime).toISOString()
      }
    }

    return {
      qq: user.qq,
      nick_name: user.nick_name,
      personal_credits: user.personal_credits,
      status: user.status,
      is_admin: user.is_admin,
      next_nickname_update_at: nextUpdate,
    }
  }),

  /**
   * 修改昵称
   */
  updateNickname: protectedProcedure.input(UpdateNicknameInput).mutation(async ({ input, ctx }) => {
    const user = await ctx.prisma.users.findUnique({ where: { qq: ctx.user.qq } })
    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '用户未找到' })
    }

    // 检查冷却时间（30天）
    if (user.last_nickname_update) {
      const lastUpdate = new Date(user.last_nickname_update)
      const nextTime = lastUpdate.getTime() + 30 * 24 * 60 * 60 * 1000
      if (Date.now() < nextTime) {
        const days = Math.ceil((nextTime - Date.now()) / (24 * 60 * 60 * 1000))
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `昵称修改冷却中，请在 ${days} 天后再试`,
        })
      }
    }

    const oldNickname = user.nick_name

    await ctx.prisma.$transaction(async tx => {
      // 1. 更新用户昵称
      await tx.users.update({
        where: { qq: ctx.user.qq },
        data: { nick_name: input.nick_name, last_nickname_update: new Date() },
      })

      // 2. 查找用户所在的所有活跃领地
      const memberships = await tx.territory_members.findMany({
        where: {
          qq: ctx.user.qq,
          territory: { status: 'ACTIVE' },
        },
        include: { territory: true },
      })

      // 3. 为每个受影响的领地创建管理任务
      for (const m of memberships) {
        await tx.admin_tasks.create({
          data: {
            type: AdminTaskType.REVIEW_MEMBER_NICKNAME_CHANGE,
            status: 'PENDING',
            payload: {
              territoryId: m.territory_id.toString(),
              territoryName: m.territory.name,
              userQq: ctx.user.qq,
              oldNickname: oldNickname || '无',
              newNickname: input.nick_name,
            },
          },
        })
      }
    })

    return { message: '昵称修改成功' }
  }),
})

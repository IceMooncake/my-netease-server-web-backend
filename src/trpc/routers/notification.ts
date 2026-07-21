import { z } from 'zod'
import { notificationService } from '../../services/index.js'
import { protectedProcedure, router } from '../trpc.js'

// ── Zod Schemas ──────────────────────────────────────────

const IdParam = z.object({
  id: z.string(),
})

// ── Router ───────────────────────────────────────────────

export const notificationRouter = router({
  /**
   * 获取未读通知列表
   */
  unread: protectedProcedure.query(async ({ ctx }) => {
    const notifications = await notificationService.getUnreadNotifications(ctx.user.qq)
    return notifications.map(n => ({
      id: n.id.toString(),
      content: n.content,
      is_read: n.is_read,
      created_at: n.created_at.toISOString(),
    }))
  }),

  /**
   * 标记通知为已读
   */
  markRead: protectedProcedure.input(IdParam).mutation(async ({ input, ctx }) => {
    await notificationService.markAsRead(BigInt(input.id), ctx.user.qq)
    return { message: '已标记为已读' }
  }),
})

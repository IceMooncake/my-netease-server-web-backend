import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import type { Context } from './context.js'

/**
 * tRPC 实例初始化
 * 使用 superjson 作为 transformer 以支持 Date/BigInt 等类型序列化
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        message: error.message,
      },
    }
  },
})

// 导出可复用的构建块
export const { router, middleware, mergeRouters } = t

// ── 认证中间件 ─────────────────────────────────────────

const requireAuth = middleware(async ({ ctx, next }) => {
  if (!ctx.user?.qq) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: '未登录' })
  }
  return next({
    ctx: {
      user: ctx.user as { qq: string },
    },
  })
})

const requireAdmin = middleware(async ({ ctx, next }) => {
  if (!ctx.user?.qq) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: '未登录' })
  }
  const dbUser = await ctx.prisma.users.findUnique({
    where: { qq: ctx.user.qq },
    select: { is_admin: true },
  })
  if (!dbUser || dbUser.is_admin !== 1) {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要管理员权限' })
  }
  return next({
    ctx: {
      user: ctx.user as { qq: string },
    },
  })
})

// ── 过程（Procedure）导出 ──────────────────────────────

/** 公开过程 — 无需登录 */
export const publicProcedure = t.procedure

/** 受保护过程 — 必须登录 */
export const protectedProcedure = t.procedure.use(requireAuth)

/** 管理员过程 — 必须管理员 */
export const adminProcedure = t.procedure.use(requireAuth).use(requireAdmin)

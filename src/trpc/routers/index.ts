import { router } from '../trpc.js'
import { adminRouter } from './admin.js'
import { authRouter } from './auth.js'
import { notificationRouter } from './notification.js'
import { territoryRouter } from './territory.js'
import { userRouter } from './user.js'

/**
 * 根路由器 — 组合所有子路由器
 */
export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  territory: territoryRouter,
  admin: adminRouter,
  notification: notificationRouter,
})

export type AppRouter = typeof appRouter

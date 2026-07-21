import { z } from 'zod'
import { AdminTaskStatus } from '../../generated/prisma/enums.js'
import { adminService } from '../../services/index.js'
import { adminProcedure, router } from '../trpc.js'

// ── Zod Schemas ──────────────────────────────────────────

const ListTasksInput = z.object({
  status: z.nativeEnum(AdminTaskStatus).optional(),
})

const ProcessTaskInput = z.object({
  taskId: z.string(),
  approved: z.boolean(),
  message: z.string().optional(),
})

// ── Router ───────────────────────────────────────────────

export const adminRouter = router({
  /**
   * 获取管理任务列表
   */
  tasks: adminProcedure.input(ListTasksInput).query(async ({ input }) => {
    const tasks = await adminService.getTasks(input.status)
    return tasks.map(t => ({ ...t, id: t.id.toString() }))
  }),

  /**
   * 处理管理任务
   */
  process: adminProcedure.input(ProcessTaskInput).mutation(async ({ input, ctx }) => {
    await adminService.processTask(BigInt(input.taskId), ctx.user.qq, input.approved, input.message)
    return { success: true }
  }),
})

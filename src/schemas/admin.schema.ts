// import zod and inject openapi tool
import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
extendZodWithOpenApi(z)

// listApplications 查询参数
export const ListApplicationsQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
})

// decideApplication 请求体
export const DecideApplicationBodySchema = z.object({
  approve: z.boolean(),
  message: z.string().optional(),
})

// decideApplication 路径参数
export const DecideApplicationParamsSchema = z.object({
  id: z.preprocess(v => Number(v), z.number()),
})

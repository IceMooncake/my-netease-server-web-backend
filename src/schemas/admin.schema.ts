// import zod and inject openapi tool
import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
extendZodWithOpenApi(z)

// listApplications 查询参数
export const ListApplicationsQuery = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
})

// listApplications 响应类型
export const ListApplicationsResponse = z
  .object({
    status: z.enum(['pending', 'approved', 'rejected']),
    name: z.string(),
    id: z.string(),
    type: z.enum(['overworld', 'nether', 'end']),
    cost: z.number(),
    applicant_qq: z.string(),
    decision_message: z.string().nullable(),
    processed_by: z.string().nullable(),
    created_at: z.date().nullable(),
    processed_at: z.date().nullable(),
  })
  .array()

// decideApplication 请求体
export const DecideApplicationBody = z.object({
  approve: z.boolean(),
  message: z.string().optional(),
})

// decideApplication 路径参数
export const DecideApplicationParams = z.object({
  id: z.preprocess(v => Number(v), z.number()),
})

// decideApplication 响应类型
export const DecideApplicationResponse = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('rejected'),
    territoryId: z.undefined().optional(), // 或者不写，表示不存在
  }),
  z.object({
    status: z.literal('approved'),
    territoryId: z.bigint(),
  }),
])

import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

// 领地类型枚举
export const TerritoryTypeEnum = z.enum(['overworld', 'nether', 'end'])

// 投票决策枚举
export const DecisionEnum = z.enum(['approve', 'reject'])

// apply 请求体
export const ApplyBodySchema = z.object({
  name: z.string().min(1),
  type: TerritoryTypeEnum,
  cost: z.number().optional().default(0),
})

// contribute 请求体
export const ContributeBodySchema = z.object({
  amount: z.number().min(0),
})

// proposeSpend 请求体
export const ProposeSpendBodySchema = z.object({
  amount: z.number().min(0),
})

// proposeJoin / proposeExpel 请求体
export const ProposeJoinExpelBodySchema = z.object({
  targetQQ: z.string().min(3),
})

// vote 请求体
export const VoteBodySchema = z.object({
  decision: DecisionEnum,
})

// 路径参数 schema
export const TerritoryIdParamsSchema = z.object({
  id: z.preprocess(v => {
    if (typeof v === 'string' || typeof v === 'number') {
      return BigInt(v)
    }
    return v
  }, z.bigint()),
})

export const ProposalIdParamsSchema = z.object({
  proposalId: z.preprocess(v => Number(v), z.number()),
})

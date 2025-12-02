// import zod and inject openapi tool
import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
extendZodWithOpenApi(z)

// 领地类型枚举
export const TerritoryTypeEnum = z.enum(['overworld', 'nether', 'end'])

// 投票决策枚举
export const DecisionEnum = z.enum(['approve', 'reject'])

// apply 请求体
export const ApplyBody = z.object({
  name: z.string().min(1),
  type: TerritoryTypeEnum,
  cost: z.number().optional().default(0),
})

// apply 返回值
export const ApplyResponse = z.object({
  id: z.string(),
})

// contribute 请求体
export const ContributeBody = z.object({
  amount: z.number().min(0),
})

// proposeSpend 请求体
export const ProposeSpendBody = z.object({
  amount: z.number().min(0),
})

// proposeJoin / proposeExpel 请求体
export const ProposeJoinExpelBody = z.object({
  targetQQ: z.string().min(3),
})

// vote 请求体
export const VoteBody = z.object({
  decision: DecisionEnum,
})

// vote参数
export const VoteParams = z.object({
  proposalId: z.preprocess(v => Number(v), z.number()),
})

// 路径参数 schema
export const TerritoryIdParams = z.object({
  id: z.preprocess(v => {
    if (typeof v === 'string' || typeof v === 'number') {
      return BigInt(v)
    }
    return v
  }, z.bigint()),
})

// propose 系列返回 proposalId
export const ProposalIdResponse = z.object({
  pid: z.string(),
})

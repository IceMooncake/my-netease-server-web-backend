import { z } from 'zod'
import { territoryService } from '../../services/index.js'
import { protectedProcedure, router } from '../trpc.js'

// ── Zod Schemas ──────────────────────────────────────────

const TerritoryTypeEnum = z.enum(['NO_ENTRY', 'NO_BREAK'])

const CreateTerritoryInput = z.object({
  name: z.string().min(1).max(100),
  type: TerritoryTypeEnum.optional(),
})

const UpdateLocationInput = z.object({
  x1: z.number().int(),
  z1: z.number().int(),
  x2: z.number().int(),
  z2: z.number().int(),
})

const InviteMemberInput = z.object({
  qq: z.string().min(5).max(20),
})

const DonateInput = z.object({
  amount: z.number().int().positive(),
})

const RemoveMemberInput = z.object({
  qq: z.string().min(5).max(20),
})

const IdParam = z.object({
  id: z.string(),
})

// ── Router ───────────────────────────────────────────────

export const territoryRouter = router({
  /**
   * 创建领地
   */
  create: protectedProcedure.input(CreateTerritoryInput).mutation(async ({ input, ctx }) => {
    const result = await territoryService.createTerritory(input.name, ctx.user.qq)
    return {
      id: result.id.toString(),
      name: result.name,
      status: result.status,
    }
  }),

  /**
   * 获取我的领地列表
   */
  myTerritories: protectedProcedure.query(async ({ ctx }) => {
    const territories = await territoryService.getUserTerritories(ctx.user.qq)
    return territories.map(t => ({
      ...t,
      id: t.id.toString(),
      created_at: t.created_at?.toISOString() ?? undefined,
    }))
  }),

  /**
   * 请求删除领地
   */
  requestDelete: protectedProcedure.input(IdParam).mutation(async ({ input, ctx }) => {
    return await territoryService.requestDeleteTerritory(BigInt(input.id), ctx.user.qq)
  }),

  /**
   * 更新领地区域
   */
  updateLocation: protectedProcedure
    .input(z.object({ id: z.string(), ...UpdateLocationInput.shape }))
    .mutation(async ({ input, ctx }) => {
      return await territoryService.updateTerritoryLocation(
        BigInt(input.id),
        input.x1,
        input.z1,
        input.x2,
        input.z2,
        ctx.user.qq
      )
    }),

  /**
   * 邀请成员
   */
  invite: protectedProcedure
    .input(z.object({ id: z.string(), ...InviteMemberInput.shape }))
    .mutation(async ({ input, ctx }) => {
      await territoryService.inviteMember(BigInt(input.id), ctx.user.qq, input.qq)
      return { message: '邀请已发送' }
    }),

  /**
   * 获取我收到的邀请
   */
  myInvitations: protectedProcedure.query(async ({ ctx }) => {
    return await territoryService.getUserInvitations(ctx.user.qq)
  }),

  /**
   * 获取领地的邀请列表
   */
  territoryInvitations: protectedProcedure.input(IdParam).query(async ({ input, ctx }) => {
    return await territoryService.getTerritoryInvitations(BigInt(input.id), ctx.user.qq)
  }),

  /**
   * 接受邀请
   */
  acceptInvite: protectedProcedure.input(IdParam).mutation(async ({ input, ctx }) => {
    await territoryService.acceptInvitation(BigInt(input.id), ctx.user.qq)
    return { message: '邀请已接受' }
  }),

  /**
   * 撤销/删除邀请
   */
  revokeInvite: protectedProcedure.input(IdParam).mutation(async ({ input, ctx }) => {
    await territoryService.revokeInvitation(BigInt(input.id), ctx.user.qq)
    return { message: '邀请已撤销/删除' }
  }),

  /**
   * 捐赠积分
   */
  donate: protectedProcedure
    .input(z.object({ id: z.string(), ...DonateInput.shape }))
    .mutation(async ({ input, ctx }) => {
      await territoryService.donateToTerritory(BigInt(input.id), ctx.user.qq, input.amount)
      return { message: '捐赠成功' }
    }),

  /**
   * 移除成员
   */
  removeMember: protectedProcedure
    .input(z.object({ id: z.string(), ...RemoveMemberInput.shape }))
    .mutation(async ({ input, ctx }) => {
      return await territoryService.removeMember(BigInt(input.id), input.qq, ctx.user.qq)
    }),
})

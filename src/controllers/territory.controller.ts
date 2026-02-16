import { Request, Response } from 'express'
import {
  CreateTerritorySchema,
  DonateSchema,
  InviteMemberSchema,
  RemoveMemberSchema,
  UpdateLocationSchema,
} from '../schemas/territory.schema.js'
import { territoryService } from '../services/index.js'
import { handleAsync } from '../utils/handleAsync.js'

export async function create(req: Request, res: Response) {
  handleAsync(res, async () => {
    const { name } = CreateTerritorySchema.parse(req.body)
    const user = req.user
    const result = await territoryService.createTerritory(name, user.qq)
    return {
      id: result.id.toString(),
      name: result.name,
      status: result.status,
    }
  })
}

export async function updateLocation(req: Request, res: Response) {
  handleAsync(res, async () => {
    const { id } = req.params
    const { x1, z1, x2, z2 } = UpdateLocationSchema.parse(req.body)
    const user = req.user
    const result = await territoryService.updateTerritoryLocation(
      BigInt(id),
      x1,
      z1,
      x2,
      z2,
      user.qq
    )
    return result
  })
}

export async function invite(req: Request, res: Response) {
  handleAsync(res, async () => {
    const { id } = req.params
    const { qq } = InviteMemberSchema.parse(req.body)
    const user = req.user
    await territoryService.inviteMember(BigInt(id), user.qq, qq)
    return { message: '邀请已发送' }
  })
}

export async function listMyInvitations(req: Request, res: Response) {
  handleAsync(res, async () => {
    const user = req.user
    const invitations = await territoryService.getUserInvitations(user.qq)
    return invitations
  })
}

export async function listTerritoryInvitations(req: Request, res: Response) {
  handleAsync(res, async () => {
    const { id } = req.params
    const user = req.user
    const invitations = await territoryService.getTerritoryInvitations(BigInt(id), user.qq)
    return invitations
  })
}

export async function acceptInvite(req: Request, res: Response) {
  handleAsync(res, async () => {
    const { id } = req.params // Invitation ID
    const user = req.user
    await territoryService.acceptInvitation(BigInt(id), user.qq)
    return { message: '邀请已接受' }
  })
}

export async function revokeInvite(req: Request, res: Response) {
  handleAsync(res, async () => {
    const { id } = req.params // Invitation ID
    const user = req.user
    await territoryService.revokeInvitation(BigInt(id), user.qq)
    return { message: '邀请已撤销/删除' }
  })
}

export async function donate(req: Request, res: Response) {
  handleAsync(res, async () => {
    const { id } = req.params
    const { amount } = DonateSchema.parse(req.body)
    const user = req.user
    await territoryService.donateToTerritory(BigInt(id), user.qq, amount)
    return { message: '捐赠成功' }
  })
}

export async function removeMember(req: Request, res: Response) {
  handleAsync(res, async () => {
    const { id } = req.params // Territory ID
    const { qq } = RemoveMemberSchema.parse(req.body)
    const user = req.user
    const result = await territoryService.removeMember(BigInt(id), qq, user.qq)
    return result
  })
}

export async function requestDelete(req: Request, res: Response) {
  handleAsync(res, async () => {
    const { id } = req.params
    const user = req.user
    const result = await territoryService.requestDeleteTerritory(BigInt(id), user.qq)
    return result
  })
}

export async function listMyTerritories(req: Request, res: Response) {
  handleAsync(res, async () => {
    const user = req.user
    const territories = await territoryService.getUserTerritories(user.qq)
    return territories.map(t => ({
      ...t,
      id: t.id.toString(),
      credits: t.credits,
      owner_id: t.owner_id,
      contribution: t.my_contribution,
    }))
  })
}

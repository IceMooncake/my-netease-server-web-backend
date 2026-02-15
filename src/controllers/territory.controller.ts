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
    return { message: 'Invitation sent.' }
  })
}

export async function acceptInvite(req: Request, res: Response) {
  handleAsync(res, async () => {
    const { id } = req.params // Invitation ID
    const user = req.user
    await territoryService.acceptInvitation(BigInt(id), user.qq)
    return { message: 'Invitation accepted. You are now a member.' }
  })
}

export async function revokeInvite(req: Request, res: Response) {
  handleAsync(res, async () => {
    const { id } = req.params // Invitation ID
    const user = req.user
    await territoryService.revokeInvitation(BigInt(id), user.qq)
    return { message: 'Invitation revoked/deleted.' }
  })
}

export async function donate(req: Request, res: Response) {
  handleAsync(res, async () => {
    const { id } = req.params
    const { amount } = DonateSchema.parse(req.body)
    const user = req.user
    await territoryService.donateToTerritory(BigInt(id), user.qq, amount)
    return { message: 'Donation successful.' }
  })
}

export async function removeMember(req: Request, res: Response) {
  handleAsync(res, async () => {
    const { id } = req.params
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
      // Add other fields and convert BigInt
      contribution: t.my_contribution, // Check type if bigInt
    }))
  })
}

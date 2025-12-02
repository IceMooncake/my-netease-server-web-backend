// src/controllers/territory.controller.ts
import { Request, Response, NextFunction } from 'express'
import { territoryService } from '../services/index.ts'

export async function apply(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user
    const { name, type, cost } = req.body as {
      name: string
      type: 'overworld' | 'nether' | 'end'
      cost: number
    }
    const id = await territoryService.applyCreateTerritory(user.qq, name, type, cost ?? 0)
    res.json({ applicationId: id })
  } catch (e) {
    next(e)
  }
}

export async function contribute(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user
    const territoryId = BigInt(req.params.id)
    const { amount } = req.body as { amount: number }
    await territoryService.contributeCredits(user.qq, territoryId, amount)
    res.json({ success: true })
  } catch (e) {
    next(e)
  }
}

export async function proposeSpend(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user
    const territoryId = BigInt(req.params.id)
    const { amount } = req.body as { amount: number }
    const pid = await territoryService.createProposal(user.qq, territoryId, 'spend', { amount })
    res.json({ proposalId: pid })
  } catch (e) {
    next(e)
  }
}

export async function proposeJoin(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user
    const territoryId = BigInt(req.params.id)
    const { targetQQ } = req.body as { targetQQ: string }
    const pid = await territoryService.createProposal(user.qq, territoryId, 'join', { targetQQ })
    res.json({ proposalId: pid })
  } catch (e) {
    next(e)
  }
}

export async function proposeExpel(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user
    const territoryId = BigInt(req.params.id)
    const { targetQQ } = req.body as { targetQQ: string }
    const pid = await territoryService.createProposal(user.qq, territoryId, 'expel', { targetQQ })
    res.json({ proposalId: pid })
  } catch (e) {
    next(e)
  }
}

export async function vote(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user
    const pid = Number(req.params.proposalId)
    const { decision } = req.body as { decision: 'approve' | 'reject' }
    await territoryService.voteProposal(user.qq, pid, decision)
    res.json({ success: true })
  } catch (e) {
    next(e)
  }
}

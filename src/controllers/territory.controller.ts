import { Request, Response, NextFunction } from 'express'
import { territoryService } from '../services/index.ts'
import {
  ApplyBodySchema,
  ContributeBodySchema,
  ProposeSpendBodySchema,
  ProposeJoinExpelBodySchema,
  VoteBodySchema,
  TerritoryIdParamsSchema,
  ProposalIdParamsSchema,
} from '../schemas/territory.schema.ts'

export async function apply(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user
    const body = ApplyBodySchema.parse(req.body)
    const id = await territoryService.applyCreateTerritory(user.qq, body.name, body.type, body.cost)
    res.json({ applicationId: id })
  } catch (e) {
    next(e)
  }
}

export async function contribute(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user
    const params = TerritoryIdParamsSchema.parse(req.params)
    const body = ContributeBodySchema.parse(req.body)
    await territoryService.contributeCredits(user.qq, params.id, body.amount)
    res.json({ success: true })
  } catch (e) {
    next(e)
  }
}

export async function proposeSpend(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user
    const params = TerritoryIdParamsSchema.parse(req.params)
    const body = ProposeSpendBodySchema.parse(req.body)
    const pid = await territoryService.createProposal(user.qq, params.id, 'spend', {
      amount: body.amount,
    })
    res.json({ proposalId: pid })
  } catch (e) {
    next(e)
  }
}

export async function proposeJoin(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user
    const params = TerritoryIdParamsSchema.parse(req.params)
    const body = ProposeJoinExpelBodySchema.parse(req.body)
    const pid = await territoryService.createProposal(user.qq, params.id, 'join', {
      targetQQ: body.targetQQ,
    })
    res.json({ proposalId: pid })
  } catch (e) {
    next(e)
  }
}

export async function proposeExpel(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user
    const params = TerritoryIdParamsSchema.parse(req.params)
    const body = ProposeJoinExpelBodySchema.parse(req.body)
    const pid = await territoryService.createProposal(user.qq, params.id, 'expel', {
      targetQQ: body.targetQQ,
    })
    res.json({ proposalId: pid })
  } catch (e) {
    next(e)
  }
}

export async function vote(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user
    const params = ProposalIdParamsSchema.parse(req.params)
    const body = VoteBodySchema.parse(req.body)
    await territoryService.voteProposal(user.qq, params.proposalId, body.decision)
    res.json({ success: true })
  } catch (e) {
    next(e)
  }
}

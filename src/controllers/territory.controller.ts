import { Request, Response } from 'express'
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
import { handleAsync } from '../utils/handleAsync.ts'

// apply
export function apply(req: Request, res: Response) {
  return handleAsync(res, async () => {
    const user = (req as any).user
    const body = ApplyBodySchema.parse(req.body)
    const id = await territoryService.applyCreateTerritory(user.qq, body.name, body.type, body.cost)
    return id
  })
}

// contribute
export function contribute(req: Request, res: Response) {
  return handleAsync(res, async () => {
    const user = (req as any).user
    const params = TerritoryIdParamsSchema.parse(req.params)
    const body = ContributeBodySchema.parse(req.body)
    await territoryService.contributeCredits(user.qq, params.id, body.amount)
    return true
  })
}

// proposeSpend
export function proposeSpend(req: Request, res: Response) {
  return handleAsync(res, async () => {
    const user = (req as any).user
    const params = TerritoryIdParamsSchema.parse(req.params)
    const body = ProposeSpendBodySchema.parse(req.body)
    const pid = await territoryService.createProposal(user.qq, params.id, 'spend', { amount: body.amount })
    return pid
  })
}

// proposeJoin
export function proposeJoin(req: Request, res: Response) {
  return handleAsync(res, async () => {
    const user = (req as any).user
    const params = TerritoryIdParamsSchema.parse(req.params)
    const body = ProposeJoinExpelBodySchema.parse(req.body)
    const pid = await territoryService.createProposal(user.qq, params.id, 'join', { targetQQ: body.targetQQ })
    return pid
  })
}

// proposeExpel
export function proposeExpel(req: Request, res: Response) {
  return handleAsync(res, async () => {
    const user = (req as any).user
    const params = TerritoryIdParamsSchema.parse(req.params)
    const body = ProposeJoinExpelBodySchema.parse(req.body)
    const pid = await territoryService.createProposal(user.qq, params.id, 'expel', { targetQQ: body.targetQQ })
    return pid
  })
}

// vote
export function vote(req: Request, res: Response) {
  return handleAsync(res, async () => {
    const user = (req as any).user
    const params = ProposalIdParamsSchema.parse(req.params)
    const body = VoteBodySchema.parse(req.body)
    await territoryService.voteProposal(user.qq, params.proposalId, body.decision)
    return true
  })
}

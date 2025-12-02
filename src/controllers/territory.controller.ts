import { Request, Response } from 'express'
import { territoryService } from '../services/index.ts'
import {
  ApplyBody,
  ContributeBody,
  ProposeSpendBody,
  ProposeJoinExpelBody,
  VoteBody,
  TerritoryIdParams,
  VoteParams,
  ApplyResponse,
  ProposalIdResponse,
} from '../schemas/territory.schema.ts'
import { handleAsync } from '../utils/handleAsync.ts'

// apply
export function apply(req: Request, res: Response) {
  return handleAsync(
    res,
    async () => {
      const user = req.user
      const body = ApplyBody.parse(req.body)
      return {
        id: await territoryService.applyCreateTerritory(user.qq, body.name, body.type, body.cost),
      }
    },
    { response: ApplyResponse }
  )
}

// contribute
export function contribute(req: Request, res: Response) {
  return handleAsync(res, async () => {
    const user = req.user
    const params = TerritoryIdParams.parse(req.params)
    const body = ContributeBody.parse(req.body)
    await territoryService.contributeCredits(user.qq, params.id, body.amount)
  })
}

// proposeSpend
export function proposeSpend(req: Request, res: Response) {
  return handleAsync(
    res,
    async () => {
      const user = req.user
      const params = TerritoryIdParams.parse(req.params)
      const body = ProposeSpendBody.parse(req.body)
      return {
        pid: (
          await territoryService.createProposal(user.qq, params.id, 'spend', {
            amount: body.amount,
          })
        ).toString(),
      }
    },
    { response: ProposalIdResponse }
  )
}

// proposeJoin
export function proposeJoin(req: Request, res: Response) {
  return handleAsync(
    res,
    async () => {
      const user = req.user
      const params = TerritoryIdParams.parse(req.params)
      const body = ProposeJoinExpelBody.parse(req.body)
      return {
        pid: (
          await territoryService.createProposal(user.qq, params.id, 'join', {
            targetQQ: body.targetQQ,
          })
        ).toString(),
      }
    },
    { response: ProposalIdResponse }
  )
}

// proposeExpel
export function proposeExpel(req: Request, res: Response) {
  return handleAsync(
    res,
    async () => {
      const user = req.user
      const params = TerritoryIdParams.parse(req.params)
      const body = ProposeJoinExpelBody.parse(req.body)
      return {
        pid: (
          await territoryService.createProposal(user.qq, params.id, 'expel', {
            targetQQ: body.targetQQ,
          })
        ).toString(),
      }
    },
    { response: ProposalIdResponse }
  )
}

// vote
export function vote(req: Request, res: Response) {
  return handleAsync(res, async () => {
    const user = req.user
    const params = VoteParams.parse(req.params)
    const body = VoteBody.parse(req.body)
    await territoryService.voteProposal(user.qq, params.proposalId, body.decision)
  })
}

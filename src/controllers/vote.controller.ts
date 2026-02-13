import { Request, Response } from 'express'
import { handleAsync } from '../utils/handleAsync.js'
import { voteService } from '../services/index.js'
import { CastVoteBody, SuccessResponse, VoteQuery, VoteListResponse } from '../schemas/vote.schema.js'

export async function castVote(req: Request, res: Response) {
    handleAsync(res, async () => {
        const { voteId, decision } = CastVoteBody.parse(req.body)
        const user = req.user
        await voteService.castVote(BigInt(voteId), user.qq, decision)
        return { success: true }
    }, { response: SuccessResponse })
}


export async function listVotes(req: Request, res: Response) {
    handleAsync(res, async () => {
        const { teamId, status } = VoteQuery.parse(req.query)
        const list = await voteService.getVotes(teamId, status)
        return list.map(v => ({
            id: v.id.toString(),
            team_id: v.team_id.toString(),
            type: v.type,
            status: v.status,
            title: v.title,
            creator_qq: v.creator_qq,
            deadline: v.deadline,
            yes_votes: v.yes_votes,
            no_votes: v.no_votes
        }))
    }, { response: VoteListResponse })
}

import { Request, Response } from 'express'
import { handleAsync } from '../utils/handleAsync.js'
import { voteService } from '../services/index.js'
import { CastVoteBody, SuccessResponse } from '../schemas/vote.schema.js'

export async function castVote(req: Request, res: Response) {
    handleAsync(res, async () => {
        const { voteId, decision } = CastVoteBody.parse(req.body)
        const user = req.user
        await voteService.castVote(BigInt(voteId), user.qq, decision)
        return { success: true }
    }, { response: SuccessResponse })
}

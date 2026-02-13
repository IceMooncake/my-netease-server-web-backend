import { Request, Response } from 'express'
import { handleAsync } from '../utils/handleAsync.js'
import { creditService } from '../services/index.js'
import { ContributeBody, SuccessResponse } from '../schemas/credit.schema.js'

export async function contribute(req: Request, res: Response) {
    handleAsync(res, async () => {
        const { teamId, amount } = ContributeBody.parse(req.body)
        const user = req.user
        await creditService.contributeToTeam(user.qq, BigInt(teamId), amount)
        return { success: true }
    }, { response: SuccessResponse })
}

import { Request, Response } from 'express'
import { handleAsync } from '../utils/handleAsync.js'
import { teamService } from '../services/index.js'
import { 
    CreateTeamBody, 
    JoinTeamBody, 
    TransferBody,
    CreateTeamResponse,
    SuccessResponse
} from '../schemas/team.schema.js'

export async function createTeam(req: Request, res: Response) {
    handleAsync(res, async () => {
        const { name } = CreateTeamBody.parse(req.body)
        const user = req.user
        const result = await teamService.createTeam(name, user.qq)
        return { 
            ...result, 
            id: result.id.toString(), 
            team_credits: result.team_credits.toString(),
            // Assuming result can be cast/matched to Zod schema partially. 
            // Prisma dates are Date objects, Zod expects Date or String.
        } 
    }, { response: CreateTeamResponse })
}

export async function joinTeam(req: Request, res: Response) {
    handleAsync(res, async () => {
        const { teamId } = JoinTeamBody.parse(req.body)
        const user = req.user
        await teamService.joinTeam(teamId, user.qq)
        return { success: true }
    }, { response: SuccessResponse })
}

export async function leaveTeam(req: Request, res: Response) {
    handleAsync(res, async () => {
         const { teamId } = JoinTeamBody.parse(req.body)
         const user = req.user
         await teamService.leaveTeam(teamId, user.qq)
         return { success: true }
    }, { response: SuccessResponse })
}

export async function transferOwnership(req: Request, res: Response) {
    handleAsync(res, async () => {
        const { teamId, newOwnerId } = TransferBody.parse(req.body)
        const user = req.user
        await teamService.transferOwnership(teamId, user.qq, newOwnerId)
        return { success: true }
    }, { response: SuccessResponse })
}

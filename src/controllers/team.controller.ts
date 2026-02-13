import { Request, Response } from 'express'
import { handleAsync } from '../utils/handleAsync.js'
import { teamService } from '../services/index.js'
import { 
    CreateTeamBody, 
    JoinTeamBody, 
    TransferBody,
    CreateTeamResponse,
    SuccessResponse,
    MyTeamsResponse,
    TeamDetailResponse
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


export async function getMyTeams(req: Request, res: Response) {
    handleAsync(res, async () => {
        const user = req.user
        const teams = await teamService.getUserTeams(user.qq)
        return teams.map(t => ({
            id: t.id.toString(),
            name: t.name,
            owner_id: t.owner_id,
            team_credits: t.team_credits,
            members_count: t._count.members,
            territories_count: t._count.territories
        }))
    }, { response: MyTeamsResponse })
}

export async function getTeamDetails(req: Request, res: Response) {
    handleAsync(res, async () => {
        const teamId = req.params.teamId
        const team = await teamService.getTeamDetails(teamId)
        if (!team) throw new Error('Team not found')
        return {
            id: team.id.toString(),
            name: team.name,
            owner_id: team.owner_id,
            team_credits: team.team_credits,
            members: team.members.map(m => ({ qq: m.qq, joined_at: m.joined_at! })),
            territories: team.territories.map(t => ({
                id: t.id.toString(),
                name: t.name,
                status: t.status,
                area: t.area
            }))
        }
    }, { response: TeamDetailResponse })
}

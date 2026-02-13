import { Request, Response } from 'express'
import { handleAsync } from '../utils/handleAsync.js'
import { territoryService } from '../services/index.js'
import { ProposeCreateBody, ProposeDeleteBody, ProposeCreateResponse, SuccessResponse } from '../schemas/territory.schema.js'

export async function proposeCreate(req: Request, res: Response) {
    handleAsync(res, async () => {
        const { teamId, x1, z1, x2, z2, type, name } = ProposeCreateBody.parse(req.body)
        const user = req.user
        const result = await territoryService.proposeCreateTerritory(
            teamId, x1, z1, x2, z2, type, name, user.qq
        )
        return { 
            ...result, 
            id: result.id.toString(), 
            team_id: result.team_id.toString(),
            area: result.area.toString(), 
            cost: result.cost.toString()
        }
    }, { response: ProposeCreateResponse })
}

export async function proposeDelete(req: Request, res: Response) {
    handleAsync(res, async () => {
        const { territoryId } = ProposeDeleteBody.parse(req.body)
        const user = req.user
        await territoryService.proposeDeleteTerritory(territoryId, user.qq)
        return { success: true }
    }, { response: SuccessResponse })
}

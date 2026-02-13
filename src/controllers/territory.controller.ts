import { Request, Response } from 'express'
import { handleAsync } from '../utils/handleAsync.js'
import { territoryService } from '../services/index.js'
import { ProposeCreateBody, ProposeDeleteBody, ProposeCreateResponse, SuccessResponse, TerritoryQuery, TerritoryListResponse } from '../schemas/territory.schema.js'

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


export async function listTerritories(req: Request, res: Response) {
    handleAsync(res, async () => {
        const { teamId } = TerritoryQuery.parse(req.query)
        const list = await territoryService.getAllTerritories(teamId)
        return list.map(t => ({
            id: t.id.toString(),
            name: t.name,
            team_id: t.team_id.toString(),
            x1: t.x1, z1: t.z1, x2: t.x2, z2: t.z2,
            area: t.area,
            type: t.type,
            status: t.status
        }))
    }, { response: TerritoryListResponse })
}

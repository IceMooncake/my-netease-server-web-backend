import { Request, Response, NextFunction } from 'express'
import { territoryService } from '../services/index.ts'
import prisma from '../database/prisma.ts'
import {
  ListApplicationsQuerySchema,
  DecideApplicationBodySchema,
  DecideApplicationParamsSchema,
} from '../schemas/admin.schema.ts'

export async function listApplications(req: Request, res: Response, next: NextFunction) {
  try {
    const query = ListApplicationsQuerySchema.parse(req.query)
    const list = await prisma.territory_applications.findMany({
      where: query.status ? { status: query.status } : undefined,
      orderBy: { id: 'desc' },
    })
    res.json(
      list.map(item => ({
        ...item,
        id: item.id.toString(),
      }))
    )
  } catch (e) {
    next(e)
  }
}

export async function decideApplication(req: Request, res: Response, next: NextFunction) {
  try {
    const admin = (req as any).user

    const params = DecideApplicationParamsSchema.parse(req.params)
    const body = DecideApplicationBodySchema.parse(req.body)

    const result = await territoryService.adminDecideCreate(
      params.id,
      admin.qq,
      body.approve,
      body.message
    )

    res.json(result)
  } catch (e) {
    next(e)
  }
}

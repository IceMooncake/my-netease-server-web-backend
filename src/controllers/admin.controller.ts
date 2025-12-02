import { Request, Response } from 'express'
import { territoryService } from '../services/index.ts'
import prisma from '../database/prisma.ts'
import {
  ListApplicationsQuery,
  DecideApplicationBody,
  DecideApplicationParams,
  ListApplicationsResponse,
  DecideApplicationResponse,
} from '../schemas/admin.schema.ts'
import { handleAsync } from '../utils/handleAsync.ts'

export function listApplications(req: Request, res: Response) {
  return handleAsync(
    res,
    async () => {
      const query = ListApplicationsQuery.parse(req.query)
      const list = await prisma.territory_applications.findMany({
        where: query.status ? { status: query.status } : undefined,
        orderBy: { id: 'desc' },
      })
      const result = list.map(item => ({ ...item, id: item.id.toString() }))
      return result
    },
    { response: ListApplicationsResponse }
  )
}

export function decideApplication(req: Request, res: Response) {
  return handleAsync(
    res,
    async () => {
      const admin = (req as any).user
      const params = DecideApplicationParams.parse(req.params)
      const body = DecideApplicationBody.parse(req.body)
      const result = await territoryService.adminDecideCreate(
        params.id,
        admin.qq,
        body.approve,
        body.message
      )
      // 使用 zod 验证返回值类型
      return result
    },
    { response: DecideApplicationResponse }
  )
}

import { Request, Response } from 'express'
import { handleAsync } from '../utils/handleAsync.js'
import { adminService } from '../services/index.js'
import { ListTasksQuery, ProcessTaskBody, ListTasksResponse, SuccessResponse } from '../schemas/admin.schema.js'

export async function listTasks(req: Request, res: Response) {
    handleAsync(res, async () => {
        const query = ListTasksQuery.parse(req.query)
        const tasks = await adminService.getTasks(query.status)
        return tasks.map(t => ({...t, id: t.id.toString()}))
    }, { response: ListTasksResponse })
}

export async function processTask(req: Request, res: Response) {
    handleAsync(res, async () => {
         const { taskId, approved, message } = ProcessTaskBody.parse(req.body)
          const admin = req.user
         await adminService.processTask(BigInt(taskId), admin.qq, approved, message)
         return { success: true }
    }, { response: SuccessResponse })
}

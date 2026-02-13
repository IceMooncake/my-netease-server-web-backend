import prisma from '../../database/prisma.js'
import { AdminTaskStatus, AdminTaskType } from '../../generated/prisma/enums.js'

async function getTasks(status?: AdminTaskStatus) {
    return await prisma.admin_tasks.findMany({
        where: status ? { status } : undefined,
        orderBy: { created_at: 'desc' }
    })
}

async function processTask(taskId: bigint, adminQq: string, approved: boolean, message?: string) {
    const task = await prisma.admin_tasks.findUnique({ where: { id: taskId } })
    if (!task || task.status !== 'PENDING') throw new Error('Task not valid')

    const payload = task.payload as any

    if (task.type === 'REVIEW_TERRITORY_CREATE') {
        const tid = BigInt(payload.territoryId)
        if (approved) {
            await prisma.territories.update({
                where: { id: tid },
                data: { status: 'ACTIVE' }
            })
        } else {
             // Refund and Delete
            const t = await prisma.territories.findUnique({ where: { id: tid } })
            if (t) {
                await prisma.teams.update({
                    where: { id: t.team_id },
                    data: { team_credits: { increment: t.cost } }
                })
                await prisma.territories.delete({ where: { id: tid } })
            }
        }
    } else if (task.type === 'REVIEW_TERRITORY_DELETE') {
        const tid = BigInt(payload.territoryId)
        if (approved) {
             const t = await prisma.territories.findUnique({ where: { id: tid } })
             if (t) {
                 await prisma.teams.update({
                    where: { id: t.team_id },
                    data: { team_credits: { increment: t.cost } } // Refund cost
                })
                await prisma.territories.delete({ where: { id: tid } })
             }
        }
    } else if (task.type === 'RECYCLE_TERRITORY_SIZE') {
        // Admin force recycling
         const tid = BigInt(payload.territoryId)
         if (approved) {
             const t = await prisma.territories.findUnique({ where: { id: tid } })
             if (t) {
                 await prisma.teams.update({
                    where: { id: t.team_id },
                    data: { team_credits: { increment: t.cost } }
                })
                await prisma.territories.delete({ where: { id: tid } })
             }
         }
    }

    await prisma.admin_tasks.update({
        where: { id: taskId },
        data: {
            status: approved ? 'DONE' : 'REJECTED',
            processed_by: adminQq,
            processed_at: new Date()
        }
    })
}

export default { getTasks, processTask }

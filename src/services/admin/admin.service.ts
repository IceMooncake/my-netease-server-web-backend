import prisma from '../../database/prisma.js'
import { AdminTaskStatus, AdminTaskType, TerritoryStatus } from '../../generated/prisma/enums.js'
import notificationService from '../notification/notification.service.js'
import { REFUND_PERCENTAGE } from '../territory/territory.service.js'

async function getTasks(status?: AdminTaskStatus) {
  return await prisma.admin_tasks.findMany({
    where: status ? { status } : undefined,
    orderBy: { created_at: 'desc' },
  })
}

async function processTask(taskId: bigint, adminQq: string, approved: boolean, message?: string) {
  const task = await prisma.admin_tasks.findUnique({ where: { id: taskId } })
  if (!task || task.status !== AdminTaskStatus.PENDING) throw new Error('任务无效')

  const payload = task.payload as any
  const tid = BigInt(payload.territoryId)

  // Attempt to find territory. Might be null if mistakenly deleted externally, unless logic is strict.
  const territory = await prisma.territories.findUnique({ where: { id: tid } })

  // If territory is missing and we aren't trying to delete it (where it might be already gone? No, we delete it here),
  // handle edge case.
  if (!territory && task.type !== AdminTaskType.REVIEW_TERRITORY_DELETE) {
    // Task invalid because territory gone. Mark rejected/ignored.
    await prisma.admin_tasks.update({
      where: { id: taskId },
      data: {
        status: AdminTaskStatus.IGNORED,
        processed_by: adminQq,
        processed_at: new Date(),
      },
    })
    return
  }

  const reason = message || 'No reason provided.'

  if (task.type === AdminTaskType.REVIEW_TERRITORY_CREATE) {
    if (approved) {
      await prisma.territories.update({
        where: { id: tid },
        data: { status: TerritoryStatus.ACTIVE },
      })
      if (territory) {
        await notificationService.createNotification(
          territory.owner_id,
          `您的领土 "${territory.name}" 创建成功啦`
        )
      }
    } else {
      // Rejected creation (initial claim).
      // Revert cost to pool. Reset Coords to 0.
      // This effectively "unclaims" the land but keeps the Territory entity (with members/invites).
      if (territory) {
        await prisma.territories.update({
          where: { id: tid },
          data: {
            status: TerritoryStatus.PENDING_CREATE,
            credits: { increment: territory.cost },
            cost: 0,
            area: 0,
            x1: 0,
            z1: 0,
            x2: 0,
            z2: 0,
          },
        })
        await notificationService.createNotification(
          territory.owner_id,
          `您创建领地 "${territory.name}" 的请求被拒绝。原因：${reason}`
        )
      }
    }
  } else if (task.type === AdminTaskType.REVIEW_TERRITORY_UPDATE) {
    if (approved) {
      await prisma.territories.update({
        where: { id: tid },
        data: { status: TerritoryStatus.ACTIVE },
      })
      if (territory) {
        await notificationService.createNotification(
          territory.owner_id,
          `您的领地 "${territory.name}" 范围更新完成啦`
        )
      }
    } else {
      // Revert update aka "Rollback".
      if (territory) {
        const oldCoords = payload.oldCoords
        const oldArea =
          Math.abs(oldCoords.x1 - oldCoords.x2) * Math.abs(oldCoords.z1 - oldCoords.z2)
        const oldCost = oldArea
        const correction = territory.cost - oldCost

        await prisma.territories.update({
          where: { id: tid },
          data: {
            status: TerritoryStatus.ACTIVE,
            x1: oldCoords.x1,
            z1: oldCoords.z1,
            x2: oldCoords.x2,
            z2: oldCoords.z2,
            area: oldArea,
            cost: oldCost,
            credits: { increment: correction },
          },
        })
        await notificationService.createNotification(
          territory.owner_id,
          `您更新领地 "${territory.name}" 的请求被拒绝。原因：${reason}`
        )
      }
    }
  } else if (task.type === AdminTaskType.REVIEW_TERRITORY_DELETE) {
    if (approved) {
      if (territory) {
        // Notify owner before deletion (since owner defaults to members too? Wait owner is in members?)
        await notificationService.createNotification(
          territory.owner_id,
          `您的领地 "${territory.name}" 已按请求删除。`
        )

        // Refund members (70% of contribution)
        const members = await prisma.territory_members.findMany({ where: { territory_id: tid } })
        const updates = members.map(m => {
          const refund = Math.floor(m.contribution * REFUND_PERCENTAGE)
          return prisma.users.update({
            where: { qq: m.qq },
            data: { personal_credits: { increment: refund } },
          })
        })

        // Execute refunds and delete territory
        await prisma.$transaction([...updates, prisma.territories.delete({ where: { id: tid } })])
      }
    } else {
      // Rejected delete -> Active
      if (territory) {
        await prisma.territories.update({
          where: { id: tid },
          data: { status: TerritoryStatus.ACTIVE },
        })
        await notificationService.createNotification(
          territory.owner_id,
          `您删除领地 "${territory.name}" 的请求被拒绝。原因：${reason}`
        )
      }
    }
  }

  await prisma.admin_tasks.update({
    where: { id: taskId },
    data: {
      status: approved ? AdminTaskStatus.DONE : AdminTaskStatus.REJECTED,
      processed_by: adminQq,
      processed_at: new Date(),
    },
  })
}

export default { getTasks, processTask }

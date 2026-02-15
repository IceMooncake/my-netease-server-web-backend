import prisma from '../../database/prisma.js'
import { AdminTaskStatus, AdminTaskType, TerritoryStatus } from '../../generated/prisma/enums.js'
import { REFUND_PERCENTAGE } from '../territory/territory.service.js'

async function getTasks(status?: AdminTaskStatus) {
  return await prisma.admin_tasks.findMany({
    where: status ? { status } : undefined,
    orderBy: { created_at: 'desc' },
  })
}

async function processTask(taskId: bigint, adminQq: string, approved: boolean, message?: string) {
  const task = await prisma.admin_tasks.findUnique({ where: { id: taskId } })
  if (!task || task.status !== AdminTaskStatus.PENDING) throw new Error('Task not valid')

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

  if (task.type === AdminTaskType.REVIEW_TERRITORY_CREATE) {
    if (approved) {
      await prisma.territories.update({
        where: { id: tid },
        data: { status: TerritoryStatus.ACTIVE },
      })
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
      }
    }
  } else if (task.type === AdminTaskType.REVIEW_TERRITORY_UPDATE) {
    if (approved) {
      await prisma.territories.update({
        where: { id: tid },
        data: { status: TerritoryStatus.ACTIVE },
      })
    } else {
      // Revert update aka "Rollback".
      if (territory) {
        const oldCoords = payload.oldCoords
        const oldArea =
          Math.abs(oldCoords.x1 - oldCoords.x2) * Math.abs(oldCoords.z1 - oldCoords.z2)
        const oldCost = oldArea

        // Logic:
        // DB State: Cost = NewCost. Credits = Pre - (New - Old).
        // Target: Cost = OldCost. Credits = Pre.
        // Diff needed: Pre - DB_Credits = New - Old.
        // So we add (New - Old) to DB_Credits to get Pre.
        // Wait.
        // Target Credits = DB_Credits + (NewCost - OldCost).
        // Example: Old=10, New=20. DB_Credits reduced by 10. We add 10 back.
        // NewCost (20) - OldCost (10) = 10. Correct.

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
      }
    }
  } else if (task.type === AdminTaskType.REVIEW_TERRITORY_DELETE) {
    if (approved) {
      if (territory) {
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

// Implementation of simplified territory logic
import prisma from '../../database/prisma.js'
import { AdminTaskStatus, AdminTaskType, TerritoryStatus } from '../../generated/prisma/enums.js'

export const MAX_TERRITORIES_PER_USER = 10
export const REFUND_PERCENTAGE = 0.9

// --- Helper Functions ---

function calculateArea(x1: number, z1: number, x2: number, z2: number) {
  return Math.abs(x1 - x2) * Math.abs(z1 - z2)
}

function calculateCost(area: number) {
  return area // 1 block = 1 credit (personal or territory credit pool)
}

async function checkUserTerritoryLimit(qq: string) {
  const owned = await prisma.territories.count({
    where: { owner_id: qq, status: { not: TerritoryStatus.PENDING_DELETE } },
  })
  const joined = await prisma.territory_members.count({ where: { qq } })

  // Note: owner is also a member, so 'joined' includes owned territories as well if we add owner to members table.
  // My logic adds owner to members table. So 'joined' is the total count.
  // 'owned' is redundant if we just count memberships, but we want to know if they are uniquely 'joined' or 'owned'.
  // If owner is in members table, then `joined` count is sufficient?
  // Yes. `territory_members` has a unique constraint on [qq, territory_id].

  if (joined >= MAX_TERRITORIES_PER_USER) {
    throw new Error(`已达到最大领土限制 ${MAX_TERRITORIES_PER_USER} 个`)
  }
}

// --- Core Service Methods ---

/**
 * createTerritory
 * Creates a new empty territory. Owner is automatically added as a member.
 */
export async function createTerritory(name: string, ownerQq: string) {
  await checkUserTerritoryLimit(ownerQq)

  // Use transaction to create territory and add owner as member
  return await prisma.$transaction(async tx => {
    const territory = await tx.territories.create({
      data: {
        name,
        owner_id: ownerQq,
        status: TerritoryStatus.PENDING_CREATE,
        credits: 0,
        x1: 0,
        z1: 0,
        x2: 0,
        z2: 0, // Placeholder
        area: 0,
        cost: 0,
      },
    })

    await tx.territory_members.create({
      data: {
        qq: ownerQq,
        territory_id: territory.id,
        contribution: 0,
      },
    })

    return territory
  })
}

/**
 * updateTerritoryLocation (Claim/Resize)
 * This handles the logic for setting/updating coordinates.
 * - Checks overlaps.
 * - Calculates cost difference.
 * - Deducts/Refunds territory credits.
 * - Creates or Updates Admin Task.
 */
export async function updateTerritoryLocation(
  territoryId: bigint,
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  userQq: string // The one performing the action (must be owner)
) {
  const territory = await prisma.territories.findUnique({
    where: { id: territoryId },
    include: { owner: true }, // Check owner
  })

  if (!territory) throw new Error('领土未找到')
  if (territory.owner_id !== userQq) throw new Error('只有领地主可以修改领土位置')

  const newArea = calculateArea(x1, z1, x2, z2)
  const newCost = calculateCost(newArea)

  if (newArea <= 0) throw new Error('无效的区域大小')

  // Overlap Check (Excluding self)
  const existing = await prisma.territories.findMany({
    where: {
      status: {
        in: [
          TerritoryStatus.ACTIVE,
          TerritoryStatus.PENDING_CREATE,
          TerritoryStatus.PENDING_UPDATE,
        ],
      },
      id: { not: territoryId },
    },
  })

  const minX = Math.min(x1, x2),
    maxX = Math.max(x1, x2)
  const minZ = Math.min(z1, z2),
    maxZ = Math.max(z1, z2)

  for (const t of existing) {
    if (t.area === 0) continue // Skip uninitialized territories

    const tMinX = Math.min(t.x1, t.x2),
      tMaxX = Math.max(t.x1, t.x2)
    const tMinZ = Math.min(t.z1, t.z2),
      tMaxZ = Math.max(t.z1, t.z2)

    const overlap = !(maxX <= tMinX || minX >= tMaxX || maxZ <= tMinZ || minZ >= tMaxZ)
    if (overlap) {
      throw new Error(`这个领地已经被占用啦`)
    }
  }

  const oldCost = territory.cost
  const costDiff = newCost - oldCost

  if (costDiff > 0 && territory.credits < costDiff) {
    throw new Error(`领土额度不足，还需要 ${costDiff - territory.credits} 个`)
  }

  // Transaction
  await prisma.$transaction(async tx => {
    // 1. Update Credits & Cost & Coords
    await tx.territories.update({
      where: { id: territoryId },
      data: {
        x1,
        z1,
        x2,
        z2,
        area: newArea,
        cost: newCost,
        credits: {
          decrement: costDiff,
        },
        status:
          territory.status === TerritoryStatus.ACTIVE
            ? TerritoryStatus.PENDING_UPDATE
            : TerritoryStatus.PENDING_CREATE,
      },
    })

    // 2. Handle Admin Task
    const tasks = await tx.admin_tasks.findMany({
      where: {
        status: AdminTaskStatus.PENDING,
        type: {
          in: [AdminTaskType.REVIEW_TERRITORY_CREATE, AdminTaskType.REVIEW_TERRITORY_UPDATE],
        },
      },
    })

    // Using explicit loop to locate task with matching JSON payload
    // Note: checking payload string could be fragile, but consistent format helps.
    // Ideally we'd store relation, but payload approach was chosen.
    const existingTask = tasks.find((t: any) => t.payload?.territoryId === territoryId.toString())

    // We update payload regardless of whether task exists or not
    const payload = {
      territoryId: territoryId.toString(),
      name: territory.name,
      owner: userQq,
      oldCoords: { x1: territory.x1, z1: territory.z1, x2: territory.x2, z2: territory.z2 },
      newCoords: { x1, z1, x2, z2 },
      area: newArea,
      cost: newCost,
    }

    if (existingTask) {
      await tx.admin_tasks.update({
        where: { id: existingTask.id },
        data: { payload },
      })
    } else {
      const taskType =
        territory.status === TerritoryStatus.ACTIVE
          ? AdminTaskType.REVIEW_TERRITORY_UPDATE
          : AdminTaskType.REVIEW_TERRITORY_CREATE

      await tx.admin_tasks.create({
        data: {
          type: taskType,
          status: AdminTaskStatus.PENDING,
          payload,
        },
      })
    }
  })

  return { message: '领土位置已更新。等待管理员审核' }
}

// --- Credits / Donation ---

export async function donateToTerritory(territoryId: bigint, userQq: string, amount: number) {
  if (amount <= 0) throw new Error('金额必须为正数')

  const member = await prisma.territory_members.findUnique({
    where: { qq_territory_id: { qq: userQq, territory_id: territoryId } },
  })
  if (!member) throw new Error('必须是成员或领地主才能捐赠')

  const user = await prisma.users.findUnique({ where: { qq: userQq } })
  if (!user || user.personal_credits < amount) throw new Error('个人积分不足')

  // Note: Contribution tracking is crucial
  await prisma.$transaction(async tx => {
    // Deduct from user
    await tx.users.update({
      where: { qq: userQq },
      data: { personal_credits: { decrement: amount } },
    })

    // Add to territory
    await tx.territories.update({
      where: { id: territoryId },
      data: { credits: { increment: amount } },
    })

    // Record contribution
    await tx.territory_members.update({
      where: { id: member.id },
      data: { contribution: { increment: amount } },
    })
  })

  return { message: '捐赠成功。' }
}

// --- Invitations ---

export async function inviteMember(territoryId: bigint, inviterQq: string, inviteeQq: string) {
  const territory = await prisma.territories.findUnique({ where: { id: territoryId } })
  if (!territory) throw new Error('领土未找到')
  if (territory.owner_id !== inviterQq) throw new Error('只有领地主可以邀请成员')

  const user = await prisma.users.findUnique({ where: { qq: inviteeQq } })
  if (!user) throw new Error('用户未找到')

  const isMember = await prisma.territory_members.findUnique({
    where: { qq_territory_id: { qq: inviteeQq, territory_id: territoryId } },
  })
  if (isMember) throw new Error('该用户已经是成员啦')

  const existingInvite = await prisma.invitations.findFirst({
    where: { territory_id: territoryId, invitee_qq: inviteeQq },
  })
  if (existingInvite) throw new Error('邀请已发送')

  return await prisma.invitations.create({
    data: {
      territory_id: territoryId,
      inviter_qq: inviterQq,
      invitee_qq: inviteeQq,
    },
  })
}

export async function acceptInvitation(invitationId: bigint, userQq: string) {
  const invite = await prisma.invitations.findUnique({ where: { id: invitationId } })
  if (!invite) throw new Error('邀请未找到')
  if (invite.invitee_qq !== userQq) throw new Error('这不是你的邀请')

  await checkUserTerritoryLimit(userQq)

  return await prisma.$transaction(async tx => {
    await tx.invitations.delete({ where: { id: invitationId } })

    return await tx.territory_members.create({
      data: {
        qq: userQq,
        territory_id: invite.territory_id,
        contribution: 0,
      },
    })
  })
}

export async function revokeInvitation(invitationId: bigint, userQq: string) {
  const invite = await prisma.invitations.findUnique({
    where: { id: invitationId },
    include: { territory: true },
  })
  if (!invite) throw new Error('邀请未找到')

  if (invite.territory.owner_id !== userQq && invite.invitee_qq !== userQq) {
    throw new Error('权限不足')
  }

  return await prisma.invitations.delete({ where: { id: invitationId } })
}

export async function getUserInvitations(userQq: string) {
  const invites = await prisma.invitations.findMany({
    where: { invitee_qq: userQq },
    include: { territory: true },
    orderBy: { created_at: 'desc' },
  })

  return invites.map(i => ({
    id: i.id.toString(),
    territory_id: i.territory_id.toString(),
    territory_name: i.territory.name,
    inviter_qq: i.inviter_qq,
    invitee_qq: i.invitee_qq,
    created_at: i.created_at.toISOString(),
  }))
}

export async function getTerritoryInvitations(territoryId: bigint, userQq: string) {
  const territory = await prisma.territories.findUnique({ where: { id: territoryId } })
  if (!territory) throw new Error('领地未找到')
  // Only owner (or maybe members?) can see active invitations? Usually only owner/admins.
  if (territory.owner_id !== userQq) throw new Error('权限不足')

  const invites = await prisma.invitations.findMany({
    where: { territory_id: territoryId },
    include: { territory: true },
    orderBy: { created_at: 'desc' },
  })

  return invites.map(i => ({
    id: i.id.toString(),
    territory_id: i.territory_id.toString(),
    territory_name: i.territory.name,
    inviter_qq: i.inviter_qq,
    invitee_qq: i.invitee_qq,
    created_at: i.created_at.toISOString(),
  }))
}

// --- Member Management ---

export async function removeMember(territoryId: bigint, memberQq: string, executorQq: string) {
  const territory = await prisma.territories.findUnique({ where: { id: territoryId } })
  if (!territory) throw new Error('领地未找到')

  const isSelfLeave = memberQq === executorQq
  const isOwnerKick = territory.owner_id === executorQq

  if (!isSelfLeave && !isOwnerKick) throw new Error('权限不足')
  if (memberQq === territory.owner_id) throw new Error('所有者不能离开')

  const member = await prisma.territory_members.findUnique({
    where: { qq_territory_id: { qq: memberQq, territory_id: territoryId } },
  })

  if (!member) throw new Error('在此领地中未找到成员')

  const refundAmount = Math.floor(member.contribution * REFUND_PERCENTAGE)
  const territoryDeduction = member.contribution

  await prisma.$transaction(async tx => {
    // 1. Remove Member
    await tx.territory_members.delete({
      where: { id: member.id },
    })

    // 2. Refund User
    await tx.users.update({
      where: { qq: memberQq },
      data: { personal_credits: { increment: refundAmount } },
    })

    // 3. Deduct from Territory
    // Decrement credits. Can go negative if spent.
    await tx.territories.update({
      where: { id: territoryId },
      data: { credits: { decrement: territoryDeduction } },
    })
  })

  return {
    message: '成员已移除，额度已更新',
    refund: refundAmount,
    deduction: territoryDeduction,
  }
}

// --- Deletion (Owner) ---

export async function requestDeleteTerritory(territoryId: bigint, userQq: string) {
  const territory = await prisma.territories.findUnique({ where: { id: territoryId } })
  if (!territory) throw new Error('领地未找到')
  if (territory.owner_id !== userQq) throw new Error('权限不足')

  // If territory is only in PENDING_CREATE state (never activated), delete immediately and cancel creation task.
  if (territory.status === TerritoryStatus.PENDING_CREATE) {
    await prisma.$transaction(async tx => {
      // 1. Find and cancel any pending creation tasks for this territory
      // Note: We search for tasks and check payload manually as JSON filtering varies.
      // But since we are deleting the territory, we might as well just mark them or delete them.
      // Or just let them be, but admin service handles missing territory gracefully (we added that).
      // Let's mark them as IGNORED for clarity if we can find them efficiently.

      const tasks = await tx.admin_tasks.findMany({
        where: {
          status: AdminTaskStatus.PENDING,
          type: AdminTaskType.REVIEW_TERRITORY_CREATE,
        },
      })

      const relatedTask = tasks.find((t: any) => t.payload?.territoryId === territoryId.toString())

      if (relatedTask) {
        await tx.admin_tasks.update({
          where: { id: relatedTask.id },
          data: {
            status: AdminTaskStatus.IGNORED,
            processed_at: new Date(),
            processed_by: null,
          },
        })
      }

      // 2. Refund any contributions if any member contributed during pending phase?
      // "PENDING_CREATE" implies it's being set up.
      // Members could have joined and donated.
      // We should probably refund them?
      // Logic for deletion in admin service refunds. We should replicate or reuse that.
      // Reuse logic: Refund everyone 100% since it was never active?
      // Or 70%?
      // Usually "Cancel Creation" implies full refund because service wasn't provided.
      // Let's do full refund for safety.

      const members = await tx.territory_members.findMany({ where: { territory_id: territoryId } })

      for (const m of members) {
        if (m.contribution > 0) {
          await tx.users.update({
            where: { qq: m.qq },
            data: { personal_credits: { increment: m.contribution } },
          })
        }
      }

      // 3. Delete territory
      await tx.territories.delete({ where: { id: territoryId } })
    })

    return { message: '领地创建已取消并删除。积分已退还' }
  }

  await prisma.admin_tasks.create({
    data: {
      type: AdminTaskType.REVIEW_TERRITORY_DELETE,
      status: AdminTaskStatus.PENDING,
      payload: {
        territoryId: territoryId.toString(),
        name: territory.name,
        reason: '所有者请求删除',
      },
    },
  })

  await prisma.territories.update({
    where: { id: territoryId },
    data: { status: TerritoryStatus.PENDING_DELETE },
  })

  return { message: '删除请求已提交，等待管理员审核' }
}

export async function getUserTerritories(userQq: string) {
  try {
    // Find territories where user is owner OR member
    const memberships = await prisma.territory_members.findMany({
      where: { qq: userQq },
      include: { territory: true },
    })

    return memberships.map(m => ({
      ...m.territory,
      role: m.territory.owner_id === userQq ? 'OWNER' : 'MEMBER',
      my_contribution: m.contribution,
    }))
  } catch (error) {
    console.error('Error fetching user territories:', error)
    throw new Error('Failed to fetch territories')
  }
}

export default {
  createTerritory,
  updateTerritoryLocation,
  donateToTerritory,
  inviteMember,
  acceptInvitation,
  revokeInvitation,
  getUserInvitations,
  getTerritoryInvitations,
  removeMember,
  requestDeleteTerritory,
  getUserTerritories,
  MAX_TERRITORIES_PER_USER,
  REFUND_PERCENTAGE,
}

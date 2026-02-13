import prisma from '../../database/prisma.js'

async function createTeam(name: string, ownerId: string) {
  // Check if owner already owns a team
  const existingOwned = await prisma.teams.findUnique({
    where: { owner_id: ownerId },
  })
  if (existingOwned) throw new Error('You already own a team')

  // Check if owner is already in max 5 teams
  const memberships = await prisma.team_members.count({
    where: { qq: ownerId },
  })
  if (memberships >= 5) throw new Error('You have joined max number of teams (5)')

  // Create team
  const team = await prisma.teams.create({
    data: {
      name,
      owner_id: ownerId,
      members: {
        create: {
          qq: ownerId,
        },
      },
    },
  })
  return team
}

async function joinTeam(teamId: string | number | bigint, userId: string) {
  const tid = BigInt(teamId)
  
  // Check limits
  const memberships = await prisma.team_members.count({
    where: { qq: userId },
  })
  if (memberships >= 5) throw new Error('You have joined max number of teams (5)')

  // Check if already in this team
  const existing = await prisma.team_members.findFirst({
    where: {
      qq: userId,
      team_id: tid,
    },
  })
  if (existing) throw new Error('Already a member')

  await prisma.team_members.create({
    data: {
      qq: userId,
      team_id: tid,
    },
  }).catch((e) => {
    if (e.code === 'P2003') {
      throw new Error('Team does not exist')
    }
  })
}

async function leaveTeam(teamId: string | number | bigint, userId: string) {
  const tid = BigInt(teamId)
  
  // Check if owner
  const team = await prisma.teams.findUnique({ where: { id: tid }})
  if (team && team.owner_id === userId) {
      throw new Error('Owner cannot leave team. Disband or transfer ownership first.')
  }

  // Delete membership
  // Using deleteMany because duplicate safety is handled by logic/schema constraints usually, 
  // but findUnique on compound key depends on exact client generation. deleteMany is safe.
  await prisma.team_members.deleteMany({
    where: {
      qq: userId,
      team_id: tid,
    },
  })
  
  // TODO: Trigger territory count check vs member count
  await checkTeamSizeConstraint(tid)
}

async function checkTeamSizeConstraint(teamId: bigint) {
    const memberCount = await prisma.team_members.count({ where: { team_id: teamId } })
    const team = await prisma.teams.findUnique({ 
        where: { id: teamId },
        include: { territories: true }
    })
    if (!team) return

    const limit = Math.max(1, memberCount)
    const activeCount = team.territories.filter(t => t.status === 'ACTIVE').length

    if (activeCount > limit) {
         // Create Admin Task
         await prisma.admin_tasks.create({
            data: {
                type: 'RECYCLE_TERRITORY_SIZE',
                payload: { teamId: teamId.toString(), currentCount: activeCount, limit },
                status: 'PENDING'
            }
        })
    }
}

async function transferOwnership(teamId: string | number | bigint, currentOwnerId: string, newOwnerId: string) {
    const tid = BigInt(teamId)
    const team = await prisma.teams.findUnique({ where: { id: tid } })
    if(!team || team.owner_id !== currentOwnerId) throw new Error("Not owner")
    
    // Check if new owner is member
    const isMember = await prisma.team_members.findFirst({
        where: { team_id: tid, qq: newOwnerId }
    })
    
    if (!isMember) throw new Error("New owner must be a member")

    // Check if new owner already owns a team
    const alreadyOwns = await prisma.teams.findUnique({ where: { owner_id: newOwnerId } })
    if (alreadyOwns) throw new Error("Target user already owns a team")
    
    await prisma.teams.update({
        where: { id: tid },
        data: { owner_id: newOwnerId }
    })
}

async function getTeamMembers(teamId: string | bigint) {
    return await prisma.team_members.findMany({
        where: { team_id: BigInt(teamId) },
        include: { user: true }
    })
}

async function getUserTeams(userId: string) {
    return await prisma.teams.findMany({
        where: {
            members: {
                some: { qq: userId }
            }
        },
        include: {
            _count: {
                select: { members: true, territories: true }
            }
        }
    })
}

async function getTeamDetails(teamId: string | number | bigint) {
    return await prisma.teams.findUnique({
        where: { id: BigInt(teamId) },
        include: {
            members: {
                include: { user: { select: { nick_name: true, qq: true } } }
            },
            territories: true
        }
    })
}

export default { createTeam, joinTeam, leaveTeam, transferOwnership, getTeamMembers, getUserTeams, getTeamDetails }

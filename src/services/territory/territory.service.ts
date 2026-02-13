import prisma from '../../database/prisma.js'
import voteService from '../vote/vote.service.js'
import { TerritoryType } from '../../generated/prisma/enums.js' // Use generated types if possible, or string literals

function calculateArea(x1: number, z1: number, x2: number, z2: number) {
  return Math.abs(x1 - x2) * Math.abs(z1 - z2)
}

// 1 block area = 1 credit cost
function calculateCost(area: number) {
  return area 
}

export async function proposeCreateTerritory(
  teamId: string | bigint,
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  type: TerritoryType,
  name: string,
  userQq: string
) {
  const tid = BigInt(teamId)
  const area = calculateArea(x1, z1, x2, z2)
  const cost = calculateCost(area)
  
  if (area <= 0) throw new Error("Invalid area")

  // Check overlap (Simplified 2D check)
  const existing = await prisma.territories.findMany({
      where: { 
          status: { in: ['ACTIVE', 'PENDING_CREATE'] }
      }
  })
  
  const minX = Math.min(x1, x2), maxX = Math.max(x1, x2)
  const minZ = Math.min(z1, z2), maxZ = Math.max(z1, z2)

  for (const t of existing) {
      const tMinX = Math.min(t.x1, t.x2), tMaxX = Math.max(t.x1, t.x2)
      const tMinZ = Math.min(t.z1, t.z2), tMaxZ = Math.max(t.z1, t.z2)
      
      const overlap = !(maxX <= tMinX || minX >= tMaxX || maxZ <= tMinZ || minZ >= tMaxZ)
      if (overlap) throw new Error(`Overlaps with existing territory ${t.name}`)
  }

  // Check Territory Count Limit
  const team = await prisma.teams.findUnique({ 
      where: { id: tid }, 
      include: { 
          territories: true,
          members: true
      } 
  })
  if (!team) throw new Error("Team not found")
  
  // Requirement: "Territory count limit depends on team size"
  // Example: 1 member = 1 territory, 2 = 2, etc. Limit = MembersCount.
  const limit = Math.max(1, team.members.length)
  const currentCount = team.territories.filter(t => t.status === 'ACTIVE' || t.status === 'PENDING_CREATE').length
  
  if (currentCount >= limit) {
      throw new Error(`Team territory count limit reached (${limit}). Invite more members to increase limit.`)
  }

  if (team.team_credits < cost) {
      throw new Error(`Insufficient blocks. Need ${cost}, have ${team.team_credits}`)
  }

  // Create Territory
  let territory;
  try {
      territory = await prisma.$transaction(async tx => {
          // Deduct (Freeze)
          await tx.teams.update({
              where: { id: tid },
              data: { team_credits: { decrement: cost } }
          })
  
          // Create Territory (Pending)
          return await tx.territories.create({
              data: {
                  name,
                  team_id: tid,
                  x1, z1, x2, z2,
                  area,
                  cost,
                  type,
                  status: 'PENDING_CREATE'
              }
          })
      })
  } catch (e) {
      throw e
  }

  try {
      // Create Vote
      await voteService.createVote(
          tid,
          'CREATE_TERRITORY',
          userQq,
          { territoryId: territory.id.toString() },
          `Create territory ${name} (${area} blocks) at [${x1},${z1}]`,
          territory.id
      )
  } catch (e) {
      // Rollback
      console.error("Failed to create vote, rolling back territory", e)
      await prisma.territories.delete({ where: { id: territory.id } })
      // Refund
      await prisma.teams.update({ where: { id: tid }, data: { team_credits: { increment: cost } } })
      throw e
  }
  
  return territory
}

export async function proposeDeleteTerritory(territoryId: string | bigint, userQq: string) {
    const tid = BigInt(territoryId)
    const territory = await prisma.territories.findUnique({ where: { id: tid } })
    if (!territory || territory.status !== 'ACTIVE') throw new Error("Territory not active")

    // if (territory.status === 'PENDING_DELETE') throw new Error("Already pending delete")

    // Mark as PENDING_DELETE? Or just Vote?
    // Requirement does not specify state during vote.
    // If we mark PENDING_DELETE, we prevent modifications.
    
    await voteService.createVote(
        territory.team_id,
        'DELETE_TERRITORY',
        userQq,
        { territoryId: tid.toString() },
        `Delete territory ${territory.name}`,
        tid
    )
    
    // update status to lock it?
    // await prisma.territories.update({ where: { id: tid }, data: { status: 'PENDING_DELETE' } })
}

async function getAllTerritories(teamId?: string | bigint) {
    const whereClause: any = {
        status: { in: ['ACTIVE'] } // Only show active on map generally? Or pending too?
    }
    if (teamId) {
        whereClause.team_id = BigInt(teamId)
        // If specific team queried, maybe show pending too?
        delete whereClause.status
    }
    
    return await prisma.territories.findMany({
        where: whereClause
    })
}

export default { proposeCreateTerritory, proposeDeleteTerritory, getAllTerritories }

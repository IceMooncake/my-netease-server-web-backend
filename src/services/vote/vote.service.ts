import prisma from '../../database/prisma.js'
import { VoteType, VoteStatus } from '../../generated/prisma/enums.js' // Use generated types

const VOTE_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

export async function createVote(
  teamId: bigint,
  type: VoteType,
  creatorQq: string,
  payload: any,
  title?: string,
  territoryId?: bigint
) {
  const deadline = new Date(Date.now() + VOTE_DURATION_MS)
  
  const vote = await prisma.votes.create({
    data: {
      team_id: teamId,
      creator_qq: creatorQq,
      type,
      payload: payload ?? {},
      title,
      territory_id: territoryId,
      deadline,
      status: 'PENDING'
    }
  })
  
  // Auto-cast creator's vote as YES
  await castVote(vote.id, creatorQq, true)
  
  return vote
}

export async function castVote(voteId: bigint, voterQq: string, decision: boolean) {
  const vote = await prisma.votes.findUnique({ where: { id: voteId } })
  if (!vote || vote.status !== 'PENDING') throw new Error('Vote not active')
  
  // Check membership
  const member = await prisma.team_members.findFirst({
      where: { team_id: vote.team_id, qq: voterQq }
  })
  if (!member) throw new Error('Not a member of this team')
  
  // Record vote
  // Prisma generates compound unique input as 'vote_id_voter_qq' or similar. 
  // We can use where: { vote_id: ..., voter_qq: ... } if update/upsert constraints allow, 
  // but findUnique/upsert needs the compound key.
  // In `schema.prisma`: @@unique([vote_id, voter_qq])
  // Prisma checks: where: { vote_id_voter_qq: { ... } }
  
  await prisma.vote_records.upsert({
      where: { 
          vote_id_voter_qq: { 
              vote_id: voteId, 
              voter_qq: voterQq 
          } 
      },
      create: { vote_id: voteId, voter_qq: voterQq, decision },
      update: { decision } 
  })
  
  // Check result
  await checkVoteResult(voteId)
}

async function checkVoteResult(voteId: bigint) {
    const vote = await prisma.votes.findUnique({ where: { id: voteId }})
    if (!vote || vote.status !== 'PENDING') return

    const members = await prisma.team_members.findMany({ where: { team_id: vote.team_id } })
    const totalMembers = members.length
    
    const votes = await prisma.vote_records.findMany({ where: { vote_id: voteId } })
    
    const yesVotes = votes.filter(v => v.decision).length
    
    let passed = false
    let failed = false
    
    if (totalMembers <= 4) {
        // All must agree
        if (votes.some(v => !v.decision)) {
            failed = true 
        } else if (yesVotes === totalMembers) {
            passed = true
        }
    } else {
        // > 4 members: Owner + 50%
        const team = await prisma.teams.findUnique({ where: { id: vote.team_id } })
        const ownerQq = team?.owner_id
        
        const ownerVote = votes.find(v => v.voter_qq === ownerQq)
        
        if (ownerVote && !ownerVote.decision) {
            failed = true
        } else {
            // Need >= 50% of TOTAL
            if (yesVotes >= Math.ceil(totalMembers / 2)) {
                 if (ownerVote && ownerVote.decision) {
                     passed = true
                 }
            } else {
                // Determine if impossible to pass?
                // Remaining votes = Total - Cast
                // MaxPossibleYes = YesVotes + (Total - Cast)
                // If MaxPossibleYes < Threshold -> Fail
                const castCount = votes.length
                const remaining = totalMembers - castCount
                if (yesVotes + remaining < Math.ceil(totalMembers / 2)) {
                    failed = true
                }
            }
        }
    }
    
    if (passed) {
        await prisma.votes.update({ where: { id: voteId }, data: { status: 'APPROVED' } })
        await executeVoteSuccess(vote)
    } else if (failed) {
        await prisma.votes.update({ where: { id: voteId }, data: { status: 'REJECTED' } })
        await executeVoteFailure(vote)
    }
}

async function executeVoteSuccess(vote: any) {
    const payload = vote.payload as any
    const type = vote.type as VoteType
    
    if (type === 'CREATE_TERRITORY') {
        await prisma.admin_tasks.create({
            data: {
                type: 'REVIEW_TERRITORY_CREATE',
                payload: { voteId: vote.id.toString(), territoryId: payload.territoryId.toString() }, 
                status: 'PENDING'
            }
        })
    } else if (type === 'DELETE_TERRITORY') {
         await prisma.admin_tasks.create({
            data: {
                type: 'REVIEW_TERRITORY_DELETE',
                payload: { voteId: vote.id.toString(), territoryId: payload.territoryId.toString() },
                status: 'PENDING'
            }
        })
    } else if (type === 'DISBAND_TEAM') {
        // Automatically execute
        await prisma.teams.delete({
            where: { id: vote.team_id }
        })
        // Refunds? Requirement mentions "Vote success -> Auto execute for Team changes"
    }
}

async function executeVoteFailure(vote: any) {
    const type = vote.type as VoteType

    if (type === 'CREATE_TERRITORY') {
        if (vote.territory_id) {
            const t = await prisma.territories.findUnique({ where: { id: vote.territory_id } })
            if (t && t.status === 'PENDING_CREATE') {
                 await prisma.teams.update({
                    where: { id: vote.team_id },
                    data: { team_credits: { increment: t.cost } }
                })
                await prisma.territories.delete({ where: { id: vote.territory_id } })
            }
        }
    }
}

async function getVotes(teamId?: string | bigint, status?: VoteStatus) {
    const where: any = {}
    if (teamId) where.team_id = BigInt(teamId)
    if (status) where.status = status
    
    const votes = await prisma.votes.findMany({
        where,
        include: { vote_records: true }, // To count votes
        orderBy: { created_at: 'desc' }
    })
    
    return votes.map(v => {
        const yes = v.vote_records.filter(r => r.decision).length
        const no = v.vote_records.length - yes
        return { ...v, yes_votes: yes, no_votes: no }
    })
}

export default { createVote, castVote, getVotes }

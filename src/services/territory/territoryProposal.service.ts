import prisma from '../../database/prisma.ts'
import { requiredVotesFor } from './territoryRules.ts'

/** 发起提案：消费/拉人/踢人（不立即执行） */
export async function createProposal(
  createdBy: string,
  territoryId: bigint,
  type: 'spend' | 'join' | 'expel',
  payload: any
) {
  // 必须是领地成员
  const me = await prisma.territory_members.findUnique({
    where: { qq: createdBy },
  })
  if (!me || me.territory_id !== territoryId) throw new Error('你不在该领地')

  const count = await prisma.territory_members.count({
    where: { territory_id: territoryId },
  })
  const reqVotes = requiredVotesFor(count)
  const proposal = await prisma.proposals.create({
    data: {
      territory_id: territoryId,
      type,
      payload: JSON.stringify(payload),
      created_by: createdBy,
      required_votes: reqVotes,
    },
  })
  return proposal.id
}

/** 对提案投票，并在满足条件时执行提案的副作用 */
export async function voteProposal(
  voterQQ: string,
  proposalId: number,
  decision: 'approve' | 'reject'
) {
  const prop = await prisma.proposals.findUnique({
    where: { id: proposalId },
  })
  if (!prop || prop.status !== 'pending') throw new Error('提案不存在或已处理')

  // 投票人必须是当前领地成员
  const me = await prisma.territory_members.findFirst({
    where: { qq: voterQQ },
  })
  if (!me || me.territory_id !== prop.territory_id) throw new Error('你不在该领地')

  await prisma.proposal_votes.upsert({
    where: {
      proposal_id_voter_qq: {
        // 复合唯一键，需要在 schema 中定义 @@unique([proposalId, voterQQ])
        proposal_id: proposalId,
        voter_qq: voterQQ,
      },
    },
    update: {
      decision,
    },
    create: {
      proposal_id: proposalId,
      voter_qq: voterQQ,
      decision,
    },
  })

  const votes = await prisma.proposal_votes.groupBy({
    by: ['decision'],
    _count: { decision: true },
    where: { proposal_id: proposalId },
  })

  let approves = 0
  // let rejects = 0;

  for (const v of votes) {
    if (v.decision) approves = v._count.decision
    // else rejects = v._count.decision;
  }

  if (approves >= prop.required_votes) {
    // 达成通过阈值 → 执行副作用
    await executeProposalSideEffect(prop.id)
  }
}

/** 真正执行提案的副作用（原子事务） */
async function executeProposalSideEffect(proposalId: bigint) {
  await prisma.$transaction(
    async tx => {
      // 1️⃣ 加锁提案（Prisma 没有原生 FOR UPDATE，但 serializable 隔离级别可保证安全）
      const prop = await tx.proposals.findUnique({
        where: { id: proposalId },
      })

      if (!prop || prop.status !== 'pending') {
        // 提案不存在或非待定状态，直接返回
        throw new Error('提案不存在或状态非法')
      }

      const payload = JSON.parse(String(prop.payload))
      const tId = prop.territory_id

      // -------------------------
      // 2️⃣ 不同类型的副作用逻辑
      // -------------------------
      if (prop.type === 'spend') {
        const amount = Number(payload.amount)
        if (!(amount > 0)) throw new Error('金额非法')

        // 获取领地并加锁（Prisma 不支持 select for update，但事务串行化可避免竞态）
        const territory = await tx.territories.findUnique({
          where: { id: tId },
          select: { pool_credits: true },
        })
        if (!territory) throw new Error('领地不存在')

        if (territory.pool_credits < amount) {
          throw new Error('领地额度不足')
        }

        await tx.territories.update({
          where: { id: tId },
          data: { pool_credits: { decrement: amount } },
        })

        await tx.proposals.update({
          where: { id: proposalId },
          data: { status: 'approved' },
        })
      } else if (prop.type === 'join') {
        const target = String(payload.targetQQ)

        // 删除其他领地成员身份
        await tx.territory_members.deleteMany({
          where: { qq: target },
        })

        // 加入本领地
        await tx.territory_members.create({
          data: { qq: target, territory_id: tId, role: 'member' },
        })

        // 更新 plots_limit
        const memberCount = await tx.territory_members.count({
          where: { territory_id: tId },
        })

        const newLimit = memberCount <= 1 ? 3 : 2 * memberCount

        await tx.territories.update({
          where: { id: tId },
          data: { plots_limit: newLimit },
        })

        await tx.proposals.update({
          where: { id: proposalId },
          data: { status: 'approved' },
        })
      } else if (prop.type === 'expel') {
        const target = String(payload.targetQQ)

        await tx.territory_members.deleteMany({
          where: { qq: target, territory_id: tId },
        })

        const memberCount = await tx.territory_members.count({
          where: { territory_id: tId },
        })

        const newLimit = memberCount <= 1 ? 3 : 2 * memberCount

        await tx.territories.update({
          where: { id: tId },
          data: { plots_limit: newLimit },
        })

        await tx.proposals.update({
          where: { id: proposalId },
          data: { status: 'approved' },
        })
      }

      // 3️⃣ Prisma 自动提交事务
    },
    {
      // 可选：强制串行化隔离级别（模拟 FOR UPDATE 行锁）
      isolationLevel: 'Serializable',
    }
  )
}

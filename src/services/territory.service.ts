import prisma from '../database/prisma.ts'

/** 规则：单人领地 plots = 3；多人领地 plots = 2 * 人数 */
export function computePlotsLimit(memberCount: number) {
  if (memberCount <= 1) return 3
  return 2 * memberCount
}

/** 提交创建领地申请（需要管理员审核） */
export async function applyCreateTerritory(
  applicantQQ: string,
  name: string,
  type: 'overworld' | 'nether' | 'end',
  cost: number
) {
  // 检查是否已拥有领地
  const owned = await prisma.territories.findFirst({
    where: { owner_id: applicantQQ },
  })
  if (owned) throw new Error('你已拥有一个领地')
  // 只是提交申请，不扣款（等管理员通过时扣）
  await prisma.territory_applications.create({
    data: {
      applicant_qq: applicantQQ,
      name,
      type,
      cost,
    },
  })
  return applicantQQ
}

/** 管理员审批创建领地申请 */
export async function adminDecideCreate(
  appId: number,
  adminQQ: string,
  approve: boolean,
  message?: string
) {
  return await prisma.$transaction(async tx => {
    // 查询申请记录
    const app = await tx.territory_applications.findUnique({
      where: { id: appId },
    })
    if (!app || app.status !== 'pending') throw new Error('申请不存在或已处理')

    // 审核拒绝
    if (!approve) {
      await tx.territory_applications.update({
        where: { id: appId },
        data: {
          status: 'rejected',
          processed_by: adminQQ,
          decision_message: message ?? null,
          processed_at: new Date(),
        },
      })
      return { status: 'rejected' as const }
    }

    // 锁定用户额度 (Prisma 没有直接的 SELECT ... FOR UPDATE)
    // 用事务的序列化特性代替，读取 + 更新在同一事务即可避免并发问题
    const user = await tx.users.findUnique({
      where: { qq: app.applicant_qq },
      select: { personal_credits: true },
    })
    if (!user) throw new Error('用户不存在')

    if (user.personal_credits < app.cost) {
      throw new Error('个人额度不足，无法通过')
    }

    // 扣除额度
    await tx.users.update({
      where: { qq: app.applicant_qq },
      data: {
        personal_credits: { decrement: app.cost },
      },
    })

    // 退出其他领地
    await tx.territory_members.deleteMany({
      where: { qq: app.applicant_qq },
    })

    // 创建领地
    const territory = await tx.territories.create({
      data: {
        name: app.name,
        owner_id: app.applicant_qq,
        type: app.type,
        plots_limit: 3,
      },
    })

    // 成为领主
    await tx.territory_members.create({
      data: {
        qq: app.applicant_qq,
        territory_id: territory.id,
        role: 'owner',
      },
    })

    // 更新申请状态
    await tx.territory_applications.update({
      where: { id: appId },
      data: {
        status: 'approved',
        processed_by: adminQQ,
        decision_message: message ?? null,
        processed_at: new Date(),
      },
    })

    return { status: 'approved' as const, territoryId: territory.id }
  })
}

/** 玩家向领地公共池捐献额度（不可回提） */
export async function contributeCredits(userQQ: string, territoryId: bigint, amount: number) {
  if (amount <= 0) throw new Error('金额需为正数')

  return await prisma.$transaction(async tx => {
    // 验证成员是否在该领地
    const member = await tx.territory_members.findUnique({
      where: { qq: userQQ },
      select: { territory_id: true },
    })

    if (!member || member.territory_id !== territoryId) throw new Error('你不在该领地内')

    // 查用户额度
    const user = await tx.users.findUnique({
      where: { qq: userQQ },
      select: { personal_credits: true },
    })

    if (!user) throw new Error('用户不存在')
    if (user.personal_credits < amount) throw new Error('个人额度不足')

    // 扣除个人额度
    await tx.users.update({
      where: { qq: userQQ },
      data: { personal_credits: { decrement: amount } },
    })

    // 增加领地公共额度
    await tx.territories.update({
      where: { id: territoryId },
      data: { pool_credits: { increment: amount } },
    })
  })
}

/** 生成提案所需票数：成员<=3 需要全体同意；否则需要 >=50%（向上取整） */
export function requiredVotesFor(territoryMemberCount: number) {
  if (territoryMemberCount <= 3) return territoryMemberCount
  return Math.ceil(territoryMemberCount * 0.5)
}

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

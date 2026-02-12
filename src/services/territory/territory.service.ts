import prisma from '../../database/prisma.js'

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

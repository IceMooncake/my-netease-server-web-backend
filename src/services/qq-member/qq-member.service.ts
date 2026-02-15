import prisma from '../../database/prisma.js'

// 批量更新群成员状态
async function replaceAllMembers(qqArr: string[] = []) {
  // 获取数据库中已有的群成员（qq 和 status）
  const groupMemberRows = await prisma.group_members.findMany({
    select: {
      qq: true,
      status: true,
    },
  })
  const qqMap = new Map(groupMemberRows.map(row => [row.qq, row.status]))

  // 获取数据库中已有的用户（qq 和 status）
  const userRows = await prisma.users.findMany({
    select: {
      qq: true,
      status: true,
    },
  })
  const userMap = new Map(userRows.map(row => [row.qq, row.status]))

  // 用户 QQ 在数据库中存在，且状态为 left → 更新为 active
  for (const qq of qqArr) {
    if (qqMap.has(qq)) {
      const currentStatus = qqMap.get(qq)
      if (currentStatus !== 1) {
        await prisma.group_members.update({
          where: { qq },
          data: {
            status: 1,
            updated_at: new Date(),
          },
        })
      }
      qqMap.delete(qq) // 已处理，从 map 中移除
    } else {
      // 数据库中没有，插入为 active
      await prisma.group_members.create({
        data: { qq, status: 1 },
      })
    }

    // 同步用户状态：如果用户存在且状态不是 ACTIVE，设为 ACTIVE
    if (userMap.has(qq) && userMap.get(qq) !== 'ACTIVE') {
      await prisma.users.update({
        where: { qq },
        data: {
          status: 'ACTIVE',
        },
      })
    }
  }

  // 剩下的 qqMap 中的用户 → 不在 qqArr 中 且 status 为 active → 改为 left
  for (const [qq, status] of qqMap.entries()) {
    if (status === 1) {
      await prisma.group_members.update({
        where: { qq },
        data: {
          status: 0,
          updated_at: new Date(),
        },
      }) // 更新为 left

      // 同步用户状态：如果用户存在且状态为 ACTIVE，设为 DELETED 并记录离开时间
      if (userMap.has(qq) && userMap.get(qq) === 'ACTIVE') {
        await prisma.users.update({
          where: { qq },
          data: {
            status: 'DELETED',
            left_group_at: new Date(),
          },
        })
      }
    }
  }
}

export default {
  replaceAllMembers,
}

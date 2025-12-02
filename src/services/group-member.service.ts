import prisma from '../database/prisma.ts'

// 批量更新群成员状态
async function replaceAllMembers(qqArr: string[] = []) {
  // 获取数据库中已有的群成员（user_id 和 status）
  const rows = await prisma.group_members.findMany({
    select: {
      qq: true,
      status: true,
    },
  })
  const qqMap = new Map(rows.map(row => [row.qq, row.status]))
  // 用户 ID 在数据库中存在，且状态为 left → 更新为 active
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
  }
  // 剩下的 qqMap 中的用户 → 不在 userIds 中 且 status 为 active → 改为 left
  for (const [qq, status] of qqMap.entries()) {
    if (status === 1) {
      await prisma.group_members.update({
        where: { qq },
        data: {
          status: 0,
          updated_at: new Date(),
        },
      }) // 更新为 left
    }
  }
}

export default {
  replaceAllMembers,
}

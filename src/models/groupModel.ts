import { createGroupMember, findAllGroupMembers, findGroupMemberByQQ, updateGroupMemberStatus } from '../repositories/groupMember.repo.ts';

// 保存或更新群成员
export async function upsertGroupMember(qq: string, status: 0 | 1 = 1) {
  return await updateGroupMemberStatus(qq, status);
}

// 获取所有成员 user_id
export async function replaceAllMembers(qqArr: string[] = []) {
    // 获取数据库中已有的群成员（user_id 和 status）
    const rows = await findAllGroupMembers();
    const qqMap = new Map(rows.map(row => [row.qq, row.status]));

    // 用户 ID 在数据库中存在，且状态为 left → 更新为 active
    for (const qq of qqArr) {
      if (qqMap.has(qq)) {
        const currentStatus = qqMap.get(qq);
        if (currentStatus !== 1) {
          await updateGroupMemberStatus(qq, 1);
        }
        qqMap.delete(qq); // 已处理，从 map 中移除
      } else {
        // 数据库中没有，插入为 active
        await createGroupMember(qq, 1);
      }
    }

    // 剩下的 qqMap 中的用户 → 不在 userIds 中 且 status 为 active → 改为 left
    for (const [qq, status] of qqMap.entries()) {
      if (status === 1) {
        await updateGroupMemberStatus(qq, 0); // 更新为 left
      }
    }
}

// 获取
export async function getMember(qq: string) {
    return findGroupMemberByQQ(qq);
}
import { db } from '../config/mysql.js'; // mysql2/promise 实例

// 保存或更新群成员
export async function upsertGroupMember(user_id, status = 'active') {
  const sql = `
    INSERT INTO group_members (user_id, status)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE status = ?, updated_at = NOW()
  `;
  await db.execute(sql, [user_id, status, status]);
}

// 获取所有成员 user_id
export async function replaceAllMembers(userIds = []) {
    // 获取数据库中已有的群成员（user_id 和 status）
    const [rows] = await db.execute(`SELECT user_id, status FROM group_members`);
    const dbUsersMap = new Map(rows.map(row => [row.user_id, row.status]));

    // 用户 ID 在数据库中存在，且状态为 left → 更新为 active
    for (const uid of userIds) {
      if (dbUsersMap.has(uid)) {
        const currentStatus = dbUsersMap.get(uid);
        if (currentStatus !== 'active') {
          await db.execute(
            `UPDATE group_members SET status = 'active', updated_at = NOW() WHERE user_id = ?`,
            [uid]
          );
        }
        dbUsersMap.delete(uid); // 已处理，从 map 中移除
      } else {
        // 数据库中没有，插入为 active
        await db.execute(
          `INSERT INTO group_members (user_id, status) VALUES (?, 'active')`,
          [uid]
        );
      }
    }

    // 剩下的 dbUsersMap 中的用户 → 不在 userIds 中 且 status 为 active → 改为 left
    for (const [uid, status] of dbUsersMap.entries()) {
      if (status === 'active') {
        await db.execute(
          `UPDATE group_members SET status = 'left', updated_at = NOW() WHERE user_id = ?`,
          [uid]
        );
      }
    }
}

// 获取
export async function getMember(id) {
    const [rows] = await db.execute(`SELECT user_id, status FROM group_members WHERE user_id = ?`, [id]);
    return rows[0] || null; // 返回第一个匹配的成员或 null
}
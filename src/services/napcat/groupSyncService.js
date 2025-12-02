import { napcat } from './napcatService.js';
import { upsertGroupMember, replaceAllMembers } from '../../models/groupModel.js';
import { db } from '../../config/mysql.js';

const GROUP_ID = 529260510;

export async function syncAllMembersOnStart() {
  console.log(`🔄 开始同步群 ${GROUP_ID} 的所有成员...`);
  const list = await napcat.get_group_member_list({ group_id: GROUP_ID });
  const userIds = list.map(u => u.user_id);
  await replaceAllMembers(userIds);
  console.log(`✅ 已同步 ${userIds.length} 名群成员到数据库`);
}

export function watchGroupEvents() {
  napcat.on("notice.group_increase", async (ctx) => {
    console.log(`✅ 新成员加入：${ctx.user_id}`);
    await upsertGroupMember(ctx.user_id, 'active');
  });

  napcat.on("notice.group_decrease", async (ctx) => {
    console.log(`❌ 成员退出：${ctx.user_id}`);
    await upsertGroupMember(ctx.user_id, 'left');
  });

  // 监听群消息，检查是否有验证码
  napcat.on("message.group.normal", async (ctx) => {
    if (ctx.group_id !== GROUP_ID) return;

    const code = ctx.raw_message.trim();
    const qq = ctx.user_id;

    const [rows] = await db.execute(
      `SELECT * FROM verification_codes WHERE qq = ? AND code = ? AND verified = FALSE`,
      [qq, code]
    );

    if (rows.length === 0) return;

    const row = rows[0];
    if (new Date(row.expires_at) < new Date()) return;

    // 验证成功，标记为已验证
    await db.execute(
      `UPDATE verification_codes SET verified = TRUE WHERE qq = ?`,
      [qq]
    );

    console.log(`✅ QQ ${qq} 验证码 ${code} 验证通过`);
  });

}

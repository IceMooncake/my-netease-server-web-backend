import { upsertGroupMember, replaceAllMembers } from '../../models/groupModel.ts';
import { NCWebsocket } from 'node-napcat-ts';
import { verifyCode } from '../../repositories/verificationCodes.repo.ts';

const GROUP_ID = 529260510;

export async function syncAllMembersOnStart(napcat: NCWebsocket) {
  console.log(`🔄 开始同步群 ${GROUP_ID} 的所有成员...`);
  const list = await napcat.get_group_member_list({ group_id: GROUP_ID });
  const qqMap = list.map(u => u.user_id.toString());
  await replaceAllMembers(qqMap);
  console.log(`✅ 已同步 ${qqMap.length} 名群成员到数据库`);
}

export function watchGroupEvents(napcat: NCWebsocket) {
  console.log(`👀 正在监听群 ${GROUP_ID} 的成员变动...`);

  napcat.on("notice.group_increase", async (ctx) => {
    console.log(`✅ 新成员加入：${ctx.user_id}`);
    await upsertGroupMember(ctx.user_id.toString(), 1);
  });

  napcat.on("notice.group_decrease", async (ctx) => {
    console.log(`❌ 成员退出：${ctx.user_id}`);
    await upsertGroupMember(ctx.user_id.toString(), 0);
  });

  // 监听群消息，检查是否有验证码
  napcat.on("message.group.normal", async (ctx) => {
    if (ctx.group_id !== GROUP_ID) return;
    const code = ctx.raw_message.trim();
    const qq = ctx.user_id.toString();
    // 验证成功，标记为已验证
    const access = await verifyCode(qq, code);
    if (access) {
      console.log(`✅ QQ ${qq} 验证码 ${code} 验证通过`);
    }
  });
}

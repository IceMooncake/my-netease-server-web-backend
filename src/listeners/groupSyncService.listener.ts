import { verifyCode } from '../repositories/verificationCodes.repo.ts';
import { napcatService } from '../services/index.ts';
import { updateGroupMemberStatus } from '../repositories/groupMember.repo.ts';

const { napcat } = napcatService;
const groupId = Number(process.env.NAPCAT_GROUPID)

console.log(`👀 正在监听群 ${groupId} 的成员变动...`);

napcat.on("notice.group_increase", async (ctx) => {
  console.log(`✅ 新成员加入：${ctx.user_id}`);
  await updateGroupMemberStatus(ctx.user_id.toString(), 1);
});

napcat.on("notice.group_decrease", async (ctx) => {
  console.log(`❌ 成员退出：${ctx.user_id}`);
  await updateGroupMemberStatus(ctx.user_id.toString(), 0);
});

// 监听群消息，检查是否有验证码
napcat.on("message.group.normal", async (ctx) => {
  if (ctx.group_id !== groupId) return;
  const code = ctx.raw_message.trim();
  const qq = ctx.user_id.toString();
  // 验证成功，标记为已验证
  const access = await verifyCode(qq, code);
  if (access) {
    console.log(`✅ QQ ${qq} 验证码 ${code} 验证通过`);
  }
});

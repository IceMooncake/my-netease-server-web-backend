import { napcatService, groupMemberService } from '../services/index.service.ts';

const groupId = Number(process.env.NAPCAT_GROUPID)
const { napcat } = napcatService;
const { replaceAllMembers } = groupMemberService;
console.log(`🔄 开始同步群 ${groupId} 的所有成员...`);
const list = await napcat.get_group_member_list({ group_id: groupId });
const qqMap = list.map(u => u.user_id.toString());
await replaceAllMembers(qqMap);
console.log(`✅ 已同步 ${qqMap.length} 名群成员到数据库`);
import { GROUP_ID } from "../config/napcat.ts";
import { replaceAllMembers } from "../models/groupModel.ts";
import { napcatService } from '../services/index.ts';

const { napcat } = napcatService;
console.log(`🔄 开始同步群 ${GROUP_ID} 的所有成员...`);
const list = await napcat.get_group_member_list({ group_id: GROUP_ID });
const qqMap = list.map(u => u.user_id.toString());
await replaceAllMembers(qqMap);
console.log(`✅ 已同步 ${qqMap.length} 名群成员到数据库`);
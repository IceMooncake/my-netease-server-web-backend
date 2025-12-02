import { napcatService, qqMemberService } from '../services/index.ts'

export default async function () {
  const groupId = Number(process.env.NAPCAT_GROUPID)
  console.log(`🔄 开始同步群 ${groupId} 的所有成员...`)
  const list = await napcatService.napcat.get_group_member_list({ group_id: groupId })
  const qqMap = list.map(u => u.user_id.toString())
  await qqMemberService.replaceAllMembers(qqMap)
  console.log(`✅ 已同步 ${qqMap.length} 名群成员到数据库`)
}

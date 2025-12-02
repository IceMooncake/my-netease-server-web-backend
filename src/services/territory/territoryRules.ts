/** 生成提案所需票数：成员<=3 需要全体同意；否则需要 >=50%（向上取整） */
export function requiredVotesFor(territoryMemberCount: number) {
  if (territoryMemberCount <= 3) return territoryMemberCount
  return Math.ceil(territoryMemberCount * 0.5)
}

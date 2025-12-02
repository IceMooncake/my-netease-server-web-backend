// src/services/territory.service.ts
import * as Terr from "../repositories/territories.repo.ts";
import * as Members from "../repositories/territoryMembers.repo.ts";
import * as Apps from "../repositories/applications.repo.ts";
import * as Props from "../repositories/proposals.repo.ts";
import { pool } from "../database/mysql.ts";

/** 规则：单人领地 plots = 3；多人领地 plots = 2 * 人数 */
export function computePlotsLimit(memberCount: number) {
  if (memberCount <= 1) return 3;
  return 2 * memberCount;
}

/** 提交创建领地申请（需要管理员审核） */
export async function applyCreateTerritory(applicantQQ: string, name: string, type: 'overworld'|'nether'|'end', cost: number) {
  // 检查是否已拥有领地
  const owned = await Terr.findTerritoryByOwner(applicantQQ);
  if (owned) throw new Error("你已拥有一个领地");
  // 只是提交申请，不扣款（等管理员通过时扣）
  const appId = await Apps.createApplication(applicantQQ, name, type, cost);
  return appId;
}

/** 管理员审批创建领地申请 */
export async function adminDecideCreate(appId: number, adminQQ: string, approve: boolean, message?: string) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const app = await Apps.getApplication(appId);
    if (!app || app.status !== "pending") throw new Error("申请不存在或已处理");

    if (!approve) {
      await Apps.decideApplication(appId, "rejected", adminQQ, message);
      await conn.commit(); conn.release();
      return { status: "rejected" as const };
    }

    // 扣个人额度
    await conn.execute("SELECT personal_credits FROM users WHERE qq=? FOR UPDATE", [app.applicant_qq]);
    const [rows] = await conn.execute("SELECT personal_credits FROM users WHERE qq=?", [app.applicant_qq]);
    const cur = (rows as any[])[0]?.personal_credits ?? 0;
    if (cur < app.cost) throw new Error("个人额度不足，无法通过");

    await conn.execute("UPDATE users SET personal_credits = personal_credits - ? WHERE qq=?", [app.cost, app.applicant_qq]);

    // 如果申请人处于他人领地，先退出
    await conn.execute("DELETE FROM territory_members WHERE user_id = ?", [app.applicant_qq]);

    // 创建领地 + 把申请人记为 owner
    const territoryId = await (async () => {
      const [r] = await conn.execute(
        "INSERT INTO territories (name, owner_id, type, plots_limit) VALUES (?,?,?,?)",
        [app.name, app.applicant_qq, app.type, 3] // 初始只有一个人，plots=3
      );
      return (r as any).lastInsertId || (r as any).insertId;
    })();

    await conn.execute(
      "INSERT INTO territory_members (user_id, territory_id, role) VALUES (?,?,?)",
      [app.applicant_qq, territoryId, 'owner']
    );

    await Apps.decideApplication(appId, "approved", adminQQ, message);

    await conn.commit(); conn.release();
    return { status: "approved" as const, territoryId };
  } catch (e) {
    await conn.rollback(); conn.release();
    throw e;
  }
}

/** 玩家向领地公共池捐献额度（不可回提） */
export async function contributeCredits(userQQ: string, territoryId: number, amount: number) {
  if (amount <= 0) throw new Error("金额需为正数");
  const member = await Members.findMemberByUser(userQQ);
  if (!member || member.territory_id !== territoryId) throw new Error("你不在该领地内");

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute("SELECT personal_credits FROM users WHERE qq=? FOR UPDATE", [userQQ]);
    const [rows] = await conn.execute("SELECT personal_credits FROM users WHERE qq=?", [userQQ]);
    const cur = (rows as any[])[0]?.personal_credits ?? 0;
    if (cur < amount) throw new Error("个人额度不足");
    await conn.execute("UPDATE users SET personal_credits = personal_credits - ? WHERE qq=?", [amount, userQQ]);
    await conn.execute("UPDATE territories SET pool_credits = pool_credits + ? WHERE id=?", [amount, territoryId]);
    await conn.commit(); conn.release();
  } catch (e) {
    await conn.rollback(); conn.release();
    throw e;
  }
}

/** 生成提案所需票数：成员<=3 需要全体同意；否则需要 >=50%（向上取整） */
export function requiredVotesFor(territoryMemberCount: number) {
  if (territoryMemberCount <= 3) return territoryMemberCount;
  return Math.ceil(territoryMemberCount * 0.5);
}

/** 发起提案：消费/拉人/踢人（不立即执行） */
export async function createProposal(
  createdBy: string,
  territoryId: number,
  type: 'spend'|'join'|'expel',
  payload: any
) {
  // 必须是领地成员
  const me = await Members.findMemberByUser(createdBy);
  if (!me || me.territory_id !== territoryId) throw new Error("你不在该领地");

  const count = await Members.countMembers(territoryId);
  const reqVotes = requiredVotesFor(count);
  const proposalId = await Props.createProposal(territoryId, type, payload, createdBy, reqVotes);
  return proposalId;
}

/** 对提案投票，并在满足条件时执行提案的副作用 */
export async function voteProposal(voterQQ: string, proposalId: number, decision: 'approve'|'reject') {
  const prop = await Props.getProposal(proposalId);
  if (!prop || prop.status !== "pending") throw new Error("提案不存在或已处理");

  // 投票人必须是当前领地成员
  const me = await Members.findMemberByUser(voterQQ);
  if (!me || me.territory_id !== prop.territory_id) throw new Error("你不在该领地");

  await Props.addVote(proposalId, voterQQ, decision);
  const { approves } = await Props.countVotes(proposalId);

  if (approves >= prop.required_votes) {
    // 达成通过阈值 → 执行副作用
    await executeProposalSideEffect(prop.id);
  }
}

/** 真正执行提案的副作用（原子事务） */
async function executeProposalSideEffect(proposalId: number) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute("SELECT * FROM proposals WHERE id=? FOR UPDATE", [proposalId]);
    const prop = (rows as any[])[0];
    if (!prop || prop.status !== "pending") { await conn.rollback(); conn.release(); return; }

    const payload = JSON.parse(prop.payload);
    const tId = prop.territory_id;

    if (prop.type === 'spend') {
      const amount = Number(payload.amount);
      if (!(amount > 0)) throw new Error("金额非法");
      // 从公共池扣款
      const [p] = await conn.execute("SELECT pool_credits FROM territories WHERE id=? FOR UPDATE", [tId]);
      const cur = (p as any[])[0]?.pool_credits ?? 0;
      if (cur < amount) throw new Error("领地额度不足");
      await conn.execute("UPDATE territories SET pool_credits = pool_credits - ? WHERE id=?", [amount, tId]);
      await Props.setProposalStatus(proposalId, "approved");

    } else if (prop.type === 'join') {
      const target = String(payload.targetQQ);
      // 加入前：不得拥有其他领地；若在别的领地，必须退出（由发起前沟通，或此处强制迁出）
      await conn.execute("DELETE FROM territory_members WHERE user_id = ?", [target]);
      // 加入本领地
      await conn.execute(
        "INSERT INTO territory_members (user_id, territory_id, role) VALUES (?,?,?)",
        [target, tId, 'member']
      );
      // 更新 plots_limit（2*人数）
      const [cntRows] = await conn.execute("SELECT COUNT(*) as c FROM territory_members WHERE territory_id=?", [tId]);
      const c = (cntRows as any[])[0]?.c ?? 1;
      const newLimit = c <= 1 ? 3 : 2 * c;
      await conn.execute("UPDATE territories SET plots_limit=? WHERE id=?", [newLimit, tId]);

      await Props.setProposalStatus(proposalId, "approved");

    } else if (prop.type === 'expel') {
      const target = String(payload.targetQQ);
      await conn.execute("DELETE FROM territory_members WHERE user_id = ? AND territory_id = ?", [target, tId]);
      // 更新 plots_limit
      const [cntRows] = await conn.execute("SELECT COUNT(*) as c FROM territory_members WHERE territory_id=?", [tId]);
      const c = (cntRows as any[])[0]?.c ?? 1;
      const newLimit = c <= 1 ? 3 : 2 * c;
      await conn.execute("UPDATE territories SET plots_limit=? WHERE id=?", [newLimit, tId]);

      await Props.setProposalStatus(proposalId, "approved");
    }

    await conn.commit(); conn.release();
  } catch (e) {
    await pool.execute("UPDATE proposals SET status='rejected' WHERE id=?", [proposalId]).catch(()=>{});
    await conn.rollback(); conn.release();
    throw e;
  }
}

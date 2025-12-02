// src/repositories/proposals.repo.ts
import { pool } from "../database/mysql.ts";

export type ProposalType = 'spend'|'join'|'expel';
export type ProposalStatus = 'pending'|'approved'|'rejected';

export async function createProposal(
  territoryId: number,
  type: ProposalType,
  payload: any,
  createdBy: string,
  requiredVotes: number
) {
  const [r] = await pool.execute(
    "INSERT INTO proposals (territory_id, type, payload, created_by, required_votes) VALUES (?,?,?,?,?)",
    [territoryId, type, JSON.stringify(payload), createdBy, requiredVotes]
  );
  return (r as any).insertId as number;
}

export async function getProposal(id: number) {
  const [rows] = await pool.execute("SELECT * FROM proposals WHERE id = ?", [id]);
  return (rows as any[])[0] || null;
}

export async function setProposalStatus(id: number, status: ProposalStatus) {
  await pool.execute("UPDATE proposals SET status = ? WHERE id = ?", [status, id]);
}

export async function addVote(proposalId: number, voter: string, decision: 'approve'|'reject') {
  await pool.execute(
    "INSERT INTO proposal_votes (proposal_id, voter_qq, decision) VALUES (?,?,?) ON DUPLICATE KEY UPDATE decision=VALUES(decision)",
    [proposalId, voter, decision]
  );
}

export async function countVotes(proposalId: number) {
  const [rows] = await pool.execute(
    "SELECT SUM(decision='approve') as approves, SUM(decision='reject') as rejects FROM proposal_votes WHERE proposal_id = ?",
    [proposalId]
  );
  const r = (rows as any[])[0] || { approves: 0, rejects: 0 };
  return { approves: Number(r.approves || 0), rejects: Number(r.rejects || 0) };
}

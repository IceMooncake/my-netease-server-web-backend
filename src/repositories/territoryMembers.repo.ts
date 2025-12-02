// src/repositories/territoryMembers.repo.ts
import { pool } from "../config/mysql.ts";

export async function addMember(userId: string, territoryId: number, role: 'owner'|'member') {
  const [r] = await pool.execute(
    "INSERT INTO territory_members (user_id, territory_id, role) VALUES (?,?,?)",
    [userId, territoryId, role]
  );
  return (r as any).insertId as number;
}

export async function removeMember(userId: string) {
  await pool.execute("DELETE FROM territory_members WHERE user_id = ?", [userId]);
}

export async function findMemberByUser(userId: string) {
  const [rows] = await pool.execute("SELECT * FROM territory_members WHERE user_id = ?", [userId]);
  return (rows as any[])[0] || null;
}

export async function findMembersByTerritory(territoryId: number) {
  const [rows] = await pool.execute("SELECT * FROM territory_members WHERE territory_id = ?", [territoryId]);
  return rows as any[];
}

export async function countMembers(territoryId: number) {
  const [rows] = await pool.execute("SELECT COUNT(*) as c FROM territory_members WHERE territory_id = ?", [territoryId]);
  return (rows as any[])[0]?.c ?? 0;
}

// src/repositories/territories.repo.ts
import { pool } from "../database/mysql.ts";

export async function createTerritory(name: string, ownerId: string, type: 'overworld'|'nether'|'end', plotsLimit: number) {
  const [r] = await pool.execute(
    "INSERT INTO territories (name, owner_id, type, plots_limit) VALUES (?,?,?,?)",
    [name, ownerId, type, plotsLimit]
  );
  return (r as any).insertId as number;
}

export async function findTerritoryById(id: number) {
  const [rows] = await pool.execute("SELECT * FROM territories WHERE id = ?", [id]);
  return (rows as any[])[0] || null;
}

export async function findTerritoryByOwner(ownerId: string) {
  const [rows] = await pool.execute("SELECT * FROM territories WHERE owner_id = ?", [ownerId]);
  return (rows as any[])[0] || null;
}

export async function addPoolCredits(territoryId: number, delta: number) {
  await pool.execute("UPDATE territories SET pool_credits = pool_credits + ? WHERE id = ?", [delta, territoryId]);
}

export async function consumePoolCredits(territoryId: number, amount: number) {
  const [rows] = await pool.execute("SELECT pool_credits FROM territories WHERE id = ? FOR UPDATE", [territoryId]);
  const cur = (rows as any[])[0]?.pool_credits ?? 0;
  if (cur < amount) throw new Error("领地额度不足");
  await pool.execute("UPDATE territories SET pool_credits = pool_credits - ? WHERE id = ?", [amount, territoryId]);
}

export async function updatePlotsLimit(territoryId: number, newLimit: number) {
  await pool.execute("UPDATE territories SET plots_limit = ? WHERE id = ?", [newLimit, territoryId]);
}

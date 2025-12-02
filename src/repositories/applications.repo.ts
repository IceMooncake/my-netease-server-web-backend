// src/repositories/applications.repo.ts
import { pool } from "../config/mysql.ts";

export type AppStatus = 'pending'|'approved'|'rejected';

export async function createApplication(applicant: string, name: string, type: 'overworld'|'nether'|'end', cost: number) {
  const [r] = await pool.execute(
    "INSERT INTO territory_applications (applicant_qq, name, type, cost) VALUES (?,?,?,?)",
    [applicant, name, type, cost]
  );
  return (r as any).insertId as number;
}

export async function listApplications(status?: AppStatus) {
  if (status) {
    const [rows] = await pool.execute("SELECT * FROM territory_applications WHERE status = ? ORDER BY id DESC", [status]);
    return rows as any[];
  }
  const [rows] = await pool.execute("SELECT * FROM territory_applications ORDER BY id DESC");
  return rows as any[];
}

export async function getApplication(id: number) {
  const [rows] = await pool.execute("SELECT * FROM territory_applications WHERE id = ?", [id]);
  return (rows as any[])[0] || null;
}

export async function decideApplication(id: number, status: AppStatus, adminQQ: string, message?: string) {
  await pool.execute(
    "UPDATE territory_applications SET status=?, processed_by=?, decision_message=?, processed_at=NOW() WHERE id=?",
    [status, adminQQ, message ?? null, id]
  );
}

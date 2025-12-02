import { ResultSetHeader, RowDataPacket } from "mysql2";
import { comparePassword } from "../utils/hash.ts";
import { pool } from "../database/mysql.ts";

export interface User extends RowDataPacket {
    qq: string
    password: string
    nickname?: string
    created_at?: Date
    personal_credits: number
    is_admin: boolean
}

export async function findUserByQQ(qq: string): Promise<User | null> {
    const [rows] = await pool.query<User[]>('SELECT * FROM users WHERE qq = ?', [qq]);
    return rows[0] || null;
}

export async function createUser(qq: string, hashedPassword: string): Promise<number> {
    const existingUser = await findUserByQQ(qq);
    if (existingUser) {
        throw new Error('用户已存在');
    }
    const [result] = await pool.query<ResultSetHeader>('INSERT INTO users (qq, password) VALUES (?, ?)', [qq, hashedPassword]);
    return result.insertId;
}

export async function updateUserNickname(qq: string, nickname: string): Promise<void> {
    const user = await findUserByQQ(qq);
    if (!user) {
        throw new Error('用户不存在');
    }
    await pool.query('UPDATE users SET nickname = ? WHERE qq = ?', [nickname, qq]);
}

export async function updateUserPassword(qq: string, password: string): Promise<void> {
    const user = await findUserByQQ(qq);
    if (!user) {
        throw new Error('用户不存在');
    }
    await pool.query('UPDATE users SET password = ? WHERE qq = ?', [password, qq]);
}

export async function verifyUserPassword(qq: string, password: string): Promise<boolean> {
    const user = await findUserByQQ(qq);
    if (!user) return false;
    return comparePassword(password, user.password);
}

export async function addPersonalCredits(qq: string, delta: number) {
  await pool.execute("UPDATE users SET personal_credits = personal_credits + ? WHERE qq = ?", [delta, qq]);
}

export async function consumePersonalCredits(qq: string, amount: number) {
  const [rows] = await pool.execute("SELECT personal_credits FROM users WHERE qq = ? FOR UPDATE", [qq]);
  const cur = (rows as any[])[0]?.personal_credits ?? 0;
  if (cur < amount) throw new Error("个人额度不足");
  await pool.execute("UPDATE users SET personal_credits = personal_credits - ? WHERE qq = ?", [amount, qq]);
}
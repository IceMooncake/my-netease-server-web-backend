// models/userModel.ts
import { OkPacket, RowDataPacket } from 'mysql2';
import { db } from '../config/mysql.ts';

interface User extends RowDataPacket {
  id: number;
  username: string;
  password: string;
}

export async function findUserByUsername(username: number) {
  const [rows] = await db.query<User[]>('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0];
}

export async function createUser(username: string, password: string) {
  const [result] = await db.query<OkPacket>('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
  return result.insertId;
}

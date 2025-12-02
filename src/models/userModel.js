// models/userModel.js
import { db } from '../config/mysql.js';

export async function findUserByUsername(username) {
  const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0];
}

export async function createUser(username, password) {
  const [result] = await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
  return result.insertId;
}

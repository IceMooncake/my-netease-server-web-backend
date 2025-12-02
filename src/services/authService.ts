// services/authService.ts
import { db } from '../config/mysql.ts';
import { findUserByUsername, createUser } from '../models/userModel.ts';
import { hashPassword, comparePassword } from '../utils/hash.ts';
import { generateCodeForQQ } from './verificationService.ts';
import { getMember } from '../models/groupModel.ts';
import { RowDataPacket } from 'mysql2';

export const register = async (username: number, password: string) => {

  // 检查用户是否在指定的群组中
  const isInGroup = await getMember(username);
  if (!isInGroup) throw new Error('用户不在群中');

  // 已存在用户
  const existingUser = await findUserByUsername(username);
  if (existingUser) throw new Error('用户已存在');

  // 生成或返回已有验证码
  const hashed = await hashPassword(password);
  const code = await generateCodeForQQ(username, hashed); // username 即 QQ 号

  // 返回提示信息
  throw new Error(`请在群中发送验证码：${code}，5分钟内有效`);
};

interface VerificationRow extends RowDataPacket {
  verified: boolean;
  password: string;
}

export async function confirmRegister(username: string) {
    const [rows] = await db.execute<VerificationRow[]>(
      `SELECT verified, password FROM verification_codes WHERE qq = ?`,
      [username]
    );

    if (!rows.length || !rows[0].verified) {
      throw new Error('503');
    }

    await createUser(username, rows[0].password);
    return username; // 返回新注册的用户名
}

export async function login(username: number, password: string) {
  const user = await findUserByUsername(username);
  if (!user) throw new Error('用户名或密码错误');

  const isMatch = await comparePassword(password, user.password); // ✅ 使用 bcrypt 比对密码
  if (!isMatch) throw new Error('用户名或密码错误');

  return user; // 登录成功，返回用户信息（可以后续生成 token）
}
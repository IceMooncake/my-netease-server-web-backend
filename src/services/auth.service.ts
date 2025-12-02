// services/authService.ts
import { findUserByUsername, createUser } from '../models/userModel.ts';
import { comparePassword } from '../utils/hash.ts';
import otpService from './otp.service.ts';
import { getMember } from '../models/groupModel.ts';

const register = async (qq: string, password: string) => {
  // 检查用户是否在指定的群组中
  const isInGroup = await getMember(qq);
  if (!isInGroup) throw new Error('用户不在群中');
  // 已存在用户
  const existingUser = await findUserByUsername(qq);
  if (existingUser) throw new Error('用户已存在');
  // 生成或返回已有验证码
  const code = await otpService.generateCode(qq, password); // username 即 QQ 号
  // 返回提示信息
  return {
    success: false,
    message: `请在群中发送验证码：${code}，5分钟内有效`,
  };
};

async function confirmRegister(qq: string) {
  const password = await otpService.checkIsVerified(qq)
  await createUser(qq, password);
  return qq; // 返回新注册的用户名
}

async function login(qq: string, password: string) {
  const user = await findUserByUsername(qq);
  if (!user) throw new Error('用户名或密码错误');
  const isMatch = await comparePassword(password, user.password); // ✅ 使用 bcrypt 比对密码
  if (!isMatch) throw new Error('用户名或密码错误');
  return user; // 登录成功，返回用户信息（可以后续生成 token）
}

export default {
  register,
  confirmRegister,
  login
};
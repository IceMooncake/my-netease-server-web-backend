// controllers/authController.ts
import * as AuthService from '../services/authService.ts';
import { Request, Response } from 'express';
import { handleAsync } from '../utils/handleAsync.ts';

export async function handleRegister(req: Request, res: Response) {
  const { username, password } = req.body;
  handleAsync(res, async () => {
    return await AuthService.register(username, password);
  })
}

export async function handleConfirmRegister(req: Request, res: Response) {
  const { username } = req.body;
  handleAsync(res, async () => {
    const userId = await AuthService.confirmRegister(username);
    return { msg: '注册成功', userId };
  })
}

export async function handleLogin(req: Request, res: Response) {
  const { username, password } = req.body;
  handleAsync(res, async () => {
    const user = await AuthService.login(username, password);
    return { msg: '登录成功', user: user.username };
  }, 401); // 登录失败返回 401 Unauthorized
}

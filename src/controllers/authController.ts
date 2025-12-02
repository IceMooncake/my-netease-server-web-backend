// controllers/authController.ts
import { Request, Response } from 'express';
import { handleAsync } from '../utils/handleAsync.ts';
import authService from '../services/auth.service.ts';

export async function handleRegister(req: Request, res: Response) {
  const { qq, password } = req.body;
  handleAsync(res, async () => {
    return await authService.register(qq, password);
  })
}

export async function handleConfirmRegister(req: Request, res: Response) {
  const { qq } = req.body;
  handleAsync(res, async () => {
    await authService.confirmRegister(qq);
    return { msg: '注册成功', qq };
  })
}

export async function handleLogin(req: Request, res: Response) {
  const { qq, password } = req.body;
  handleAsync(res, async () => {
    const user = await authService.login(qq, password);
    return { msg: '登录成功', user: user.qq };
  }, 401); // 登录失败返回 401 Unauthorized
}

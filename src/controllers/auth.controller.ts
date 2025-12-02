// controllers/authController.ts
import { Request, Response } from 'express'
import { handleAsync } from '../utils/handleAsync.ts'
import { authService } from '../services/index.ts'
import {
  RegisterBodySchema,
  LoginBodySchema,
  ConfirmRegisterBodySchema,
} from '../schemas/auth.schema.ts'

export async function handleRegister(req: Request, res: Response) {
  handleAsync(res, async () => {
    // ✅ 参数校验
    const { qq, password } = RegisterBodySchema.parse(req.body)

    return await authService.register(qq, password)
  })
}

export async function handleConfirmRegister(req: Request, res: Response) {
  handleAsync(res, async () => {
    const { qq } = ConfirmRegisterBodySchema.parse(req.body)
    await authService.confirmRegister(qq)
    return { msg: '注册成功', qq }
  })
}

export async function handleLogin(req: Request, res: Response) {
  handleAsync(
    res,
    async () => {
      const { qq, password } = LoginBodySchema.parse(req.body)
      const token = await authService.login(qq, password)
      return { msg: '登录成功', qq, token }
    },
    401
  )
}

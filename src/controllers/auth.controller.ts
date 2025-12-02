// controllers/authController.ts
import { Request, Response } from 'express'
import { handleAsync } from '../utils/handleAsync.ts'
import { authService } from '../services/index.ts'
import {
  RegisterBody,
  LoginBody,
  ConfirmRegisterBody,
  RegisterResponse,
  LoginResponse,
  ConfirmRegisterResponse,
} from '../schemas/auth.schema.ts'

export async function handleRegister(req: Request, res: Response) {
  handleAsync(
    res,
    async () => {
      const { qq, password } = RegisterBody.parse(req.body)
      return await authService.register(qq, password)
    },
    { schema: RegisterResponse }
  )
}

export async function handleConfirmRegister(req: Request, res: Response) {
  handleAsync(
    res,
    async () => {
      const { qq } = ConfirmRegisterBody.parse(req.body)
      await authService.confirmRegister(qq)
      return { msg: '注册成功', qq }
    },
    { schema: ConfirmRegisterResponse }
  )
}

export async function handleLogin(req: Request, res: Response) {
  handleAsync(
    res,
    async () => {
      const { qq, password } = LoginBody.parse(req.body)
      const token = await authService.login(qq, password)
      return { msg: '登录成功', qq, token }
    },
    { schema: LoginResponse, errorCode: 401 }
  )
}

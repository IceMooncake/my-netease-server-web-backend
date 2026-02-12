// controllers/authController.ts
import { Request, Response } from 'express'
import { handleAsync } from '../utils/handleAsync.js'
import { authService } from '../services/index.js'
import {
  RegisterBody,
  LoginBody,
  ConfirmRegisterBody,
  RegisterResponse,
  LoginResponse,
  ConfirmRegisterResponse,
} from '../schemas/auth.schema.js'

export async function handleRegister(req: Request, res: Response) {
  handleAsync(
    res,
    async () => {
      const { qq, password } = RegisterBody.parse(req.body)
      return await authService.register(qq, password)
    },
    { response: RegisterResponse }
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
    { response: ConfirmRegisterResponse }
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
    { response: LoginResponse, errorCode: 401 }
  )
}

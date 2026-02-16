// src/controllers/user.controller.ts
import { Request, Response } from 'express'
import prisma from '../database/prisma.js' // Direct prisma access strictly for reading basic info
import { UserProfileResponse } from '../schemas/auth.schema.js'
import { handleAsync } from '../utils/handleAsync.js'

export async function getMe(req: Request, res: Response) {
  handleAsync(
    res,
    async () => {
      const qq = req.user.qq
      const user = await prisma.users.findUnique({
        where: { qq },
      })
      if (!user) throw new Error('用户未找到')

      return {
        qq: user.qq,
        nick_name: user.nick_name,
        personal_credits: user.personal_credits,
        status: user.status,
        is_admin: user.is_admin,
      }
    },
    { response: UserProfileResponse }
  )
}

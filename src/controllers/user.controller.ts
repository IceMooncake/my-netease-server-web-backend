// src/controllers/user.controller.ts
import { Request, Response } from 'express';
import prisma from '../database/prisma.js'; // Direct prisma access strictly for reading basic info
import { AdminTaskType } from '../generated/prisma/enums.js';
import { UpdateNicknameBody, UserProfileResponse } from '../schemas/auth.schema.js';
import { handleAsync } from '../utils/handleAsync.js';

export async function getMe(req: Request, res: Response) {
  handleAsync(
    res,
    async () => {
      const qq = req.user.qq
      const user = await prisma.users.findUnique({
        where: { qq },
      })
      if (!user) throw new Error('用户未找到')

      let nextUpdate: Date | null = null
      if (user.last_nickname_update) {
        const lastUpdate = new Date(user.last_nickname_update)
        const nextTime = lastUpdate.getTime() + 30 * 24 * 60 * 60 * 1000
        if (nextTime > Date.now()) {
          nextUpdate = new Date(nextTime)
        }
      }

      return {
        qq: user.qq,
        nick_name: user.nick_name,
        personal_credits: user.personal_credits,
        status: user.status,
        is_admin: user.is_admin,
        next_nickname_update_at: nextUpdate ? nextUpdate.toISOString() : null,
      }
    },
    { response: UserProfileResponse }
  )
}

export async function updateNickname(req: Request, res: Response) {
  handleAsync(
    res,
    async () => {
      const qq = req.user.qq
      const { nick_name } = UpdateNicknameBody.parse(req.body)
      
      const user = await prisma.users.findUnique({ where: { qq } })
      if (!user) throw new Error('用户未找到')

      if (user.last_nickname_update) {
        const lastUpdate = new Date(user.last_nickname_update)
        const nextTime = lastUpdate.getTime() + 30 * 24 * 60 * 60 * 1000
        if (Date.now() < nextTime) {
          const days = Math.ceil((nextTime - Date.now()) / (24 * 60 * 60 * 1000))
          throw new Error(`昵称修改冷却中，请在 ${days} 天后再试`)
        }
      }

      // Use transaction to ensure consistency
      await prisma.$transaction(async tx => {
        // 1. Update User Nickname
        await tx.users.update({
          where: { qq },
          data: {
            nick_name,
            last_nickname_update: new Date(),
          },
        })

        // 2. Find active territories where user is a member
        // Assuming memberships are in `territory_members` and we need to check territory status
        const memberships = await tx.territory_members.findMany({
          where: {
            qq: qq,
            territory: {
              status: 'ACTIVE',
            },
          },
          include: {
            territory: true,
          },
        })

        // 3. Create admin tasks for each affected territory
        for (const m of memberships) {
          const payload = {
            territoryId: m.territory_id.toString(),
            territoryName: m.territory.name,
            userQq: qq,
            oldNickname: user.nick_name || '无', // Handle potential null old nickname
            newNickname: nick_name,
          }

          await tx.admin_tasks.create({
            data: {
              type: AdminTaskType.REVIEW_MEMBER_NICKNAME_CHANGE,
              status: 'PENDING',
              payload,
            },
          })
        }
      })
      
      return { message: '昵称修改成功' }
    }
  )
}

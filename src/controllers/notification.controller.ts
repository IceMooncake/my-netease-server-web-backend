import { Request, Response } from 'express'
import { notificationService } from '../services/index.js'
import { handleAsync } from '../utils/handleAsync.js'

export async function listUnread(req: Request, res: Response) {
  handleAsync(res, async () => {
    const user = req.user
    const notifications = await notificationService.getUnreadNotifications(user.qq)
    return notifications.map(n => ({
      id: n.id.toString(),
      content: n.content,
      is_read: n.is_read,
      created_at: n.created_at.toISOString(),
    }))
  })
}

export async function markRead(req: Request, res: Response) {
  handleAsync(res, async () => {
    const { id } = req.params
    const user = req.user
    await notificationService.markAsRead(BigInt(id), user.qq)
    return { message: 'Marked as read.' }
  })
}

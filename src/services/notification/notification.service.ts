import prisma from '../../database/prisma.js'

async function getUnreadNotifications(userQq: string) {
  return await prisma.notifications.findMany({
    where: {
      user_qq: userQq,
      is_read: false,
    },
    orderBy: {
      created_at: 'desc',
    },
  })
}

async function markAsRead(notificationId: bigint, userQq: string) {
  const notification = await prisma.notifications.findUnique({
    where: { id: notificationId },
  })

  if (!notification) throw new Error('通知未找到')
  if (notification.user_qq !== userQq) throw new Error('这不是你的通知')

  return await prisma.notifications.update({
    where: { id: notificationId },
    data: { is_read: true },
  })
}

async function createNotification(userQq: string, content: string) {
  const user = await prisma.users.findUnique({ where: { qq: userQq } })
  if (!user) return // User might be deleted, skipping notification.

  return await prisma.notifications.create({
    data: {
      user_qq: userQq,
      content: content,
    },
  })
}

export default {
  getUnreadNotifications,
  markAsRead,
  createNotification,
}

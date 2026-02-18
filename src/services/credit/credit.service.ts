import prisma from '../../database/prisma.js'
import napcatService from '../napcat/napcat.service.js'

const { napcat } = napcatService

export const DAILY_CHECK_IN_REWARD = 10 // Configurable amount (not used anymore, now random)
const CHECK_IN_NOTIFY_WINDOW_MS = 3000
const groupId = Number(process.env.NAPCAT_GROUPID)

const pendingCheckInUserIds = new Map<string, number>() // userId -> reward
let checkInNotifyTimer: NodeJS.Timeout | null = null

function flushCheckInNotifications() {
  if (pendingCheckInUserIds.size === 0) {
    return
  }

  const userRewards = Array.from(pendingCheckInUserIds.entries())
  pendingCheckInUserIds.clear()

  const message: Parameters<typeof napcat.send_group_msg>[0]['message'] = []

  for (const [userId, reward] of userRewards) {
    message.push(
      {
        type: 'at',
        data: {
          qq: userId,
        },
      },
      {
        type: 'text',
        data: {
          text: ` 签到成功，获得${reward}方块额度！`,
        },
      }
    )
  }
  napcat.send_group_msg({
    group_id: groupId,
    message,
  })
}

function enqueueCheckInNotification(userId: string, reward: number) {
  pendingCheckInUserIds.set(userId, reward)

  if (checkInNotifyTimer) {
    return
  }

  const scheduleFlush = () => {
    checkInNotifyTimer = setTimeout(() => {
      flushCheckInNotifications()
      checkInNotifyTimer = null

      if (pendingCheckInUserIds.size > 0) {
        scheduleFlush()
      }
    }, CHECK_IN_NOTIFY_WINDOW_MS)
  }

  scheduleFlush()
}

/**
 * Perform daily check-in for a user.
 * Returns true if check-in was successful (first time today), false otherwise.
 */
export async function checkIn(userId: string): Promise<boolean> {
  const user = await prisma.users.findUnique({
    where: { qq: userId },
  })

  if (!user) return false

  // Use +8 timezone for daily check comparison
  const tzOffset = 8 * 60 * 60 * 1000 // +8 timezone offset in ms
  const todayDate = new Date(Date.now() + tzOffset)
  const today = todayDate.toISOString().split('T')[0] // 'YYYY-MM-DD' in +8 timezone
  const lastCheck = user.last_daily_check_in
    ? new Date(user.last_daily_check_in.getTime() + tzOffset).toISOString().split('T')[0]
    : null

  // If already checked in today, return false
  if (lastCheck === today) {
    return false
  }

  // Generate random reward between 6 and 66
  const reward = Math.floor(Math.random() * (66 - 6 + 1)) + 6

  // Update user
  await prisma.users.update({
    where: { qq: userId },
    data: {
      last_daily_check_in: todayDate,
      personal_credits: {
        increment: reward,
      },
    },
  })

  enqueueCheckInNotification(userId, reward)
  return true
}

export default { checkIn }

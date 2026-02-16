import prisma from '../../database/prisma.js'
import napcatService from '../napcat/napcat.service.js'

const { napcat } = napcatService

export const DAILY_CHECK_IN_REWARD = 10 // Configurable amount
const CHECK_IN_NOTIFY_WINDOW_MS = 3000

const pendingCheckInUserIds = new Set<string>()
let checkInNotifyTimer: NodeJS.Timeout | null = null

function flushCheckInNotifications() {
  if (pendingCheckInUserIds.size === 0) {
    return
  }

  const userIds = Array.from(pendingCheckInUserIds)
  pendingCheckInUserIds.clear()

  const message: Parameters<typeof napcat.send_group_msg>[0]['message'] = []

  for (const userId of userIds) {
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
          text: ' ',
        },
      }
    )
  }

  message.push({
    type: 'text',
    data: {
      text: `\n签到成功，获得${DAILY_CHECK_IN_REWARD}方块额度！`,
    },
  })

  napcat.send_group_msg({
    group_id: Number(process.env.NAPCAT_GROUPID),
    message,
  })
}

function enqueueCheckInNotification(userId: string) {
  pendingCheckInUserIds.add(userId)

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

  const today = new Date().toISOString().split('T')[0] // 'YYYY-MM-DD'
  const lastCheck = user.last_daily_check_in
    ? user.last_daily_check_in.toISOString().split('T')[0]
    : null

  // If already checked in today, return false
  if (lastCheck === today) {
    return false
  }

  // Update user
  await prisma.users.update({
    where: { qq: userId },
    data: {
      last_daily_check_in: new Date(),
      personal_credits: {
        increment: DAILY_CHECK_IN_REWARD,
      },
    },
  })

  enqueueCheckInNotification(userId)
  return true
}

export default { checkIn, DAILY_CHECK_IN_REWARD }

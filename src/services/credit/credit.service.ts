import prisma from '../../database/prisma.js'

export const DAILY_CHECK_IN_REWARD = 10 // Configurable amount

/**
 * Perform daily check-in for a user.
 * Returns true if check-in was successful (first time today), false otherwise.
 */
export async function checkIn(userId: string): Promise<boolean> {
  const user = await prisma.users.findUnique({
    where: { qq: userId },
  })

  if (!user) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // If already checked in today (or later), return false
  if (user.last_daily_check_in && user.last_daily_check_in >= today) {
    return false
  }

  // Update user
  await prisma.users.update({
    where: { qq: userId },
    data: {
      last_daily_check_in: today,
      personal_credits: {
        increment: DAILY_CHECK_IN_REWARD,
      },
    },
  })

  return true
}

/**
 * Contribute personal credits to a team.
 */
export async function contributeToTeam(userId: string, teamId: number | bigint, amount: number) {
  if (amount <= 0) throw new Error("Amount must be positive")

  // Transaction to ensure atomicity
  return await prisma.$transaction(async (tx) => {
    const user = await tx.users.findUnique({
      where: { qq: userId },
    })
    
    if (!user || user.personal_credits < amount) {
      throw new Error("Insufficient personal credits")
    }

    // Deduct from user
    await tx.users.update({
      where: { qq: userId },
      data: {
        personal_credits: {
          decrement: amount,
        },
      },
    })

    // Add to team
    await tx.teams.update({
      where: { id: teamId },
      data: {
        team_credits: {
          increment: amount,
        },
      },
    })
    
    return true
  })
}


export default { checkIn, contributeToTeam, DAILY_CHECK_IN_REWARD }

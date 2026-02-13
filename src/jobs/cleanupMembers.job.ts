import cron from 'node-cron'
import prisma from '../database/prisma.js'

export default () => {
  // Check every day at 3 AM
  cron.schedule('0 3 * * *', async () => {
    console.log('Running cleanup members job...')
    
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    // Find frozen users older than 30 days
    const users = await prisma.users.findMany({
        where: {
            status: 'FROZEN',
            left_group_at: {
                lt: thirtyDaysAgo
            }
        }
    })
    
    for (const user of users) {
        // Create Admin Task for cleanup
        await prisma.admin_tasks.create({
            data: {
                type: 'CLEANUP_USER',
                payload: { userQq: user.qq, reason: 'Left group > 30 days' },
                status: 'PENDING'
            }
        })
        console.log(`Created cleanup task for user ${user.qq}`)
    }
  })
}

import startSyncGroupMember from './syncGroupMember.job.ts'

export default async function () {
  await startSyncGroupMember()
}

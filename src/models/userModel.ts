import { findUserByQQ, createUser as dbCreateUser } from '../repositories/users.repo.ts';

export async function findUserByUsername(qq: string) {
  return await findUserByQQ(qq)
}

export async function createUser(qq: string, password: string) {
  dbCreateUser(qq, password)
}

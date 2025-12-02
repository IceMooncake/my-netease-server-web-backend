import { createVerificationCode } from '../repositories/verificationCodes.repo.ts';

export async function generateCodeForQQ(qq: string, password: string) {
    return await createVerificationCode(qq.toString(), password)
}

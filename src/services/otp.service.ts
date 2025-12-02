import { createVerificationCode } from '../repositories/verificationCodes.repo.ts';

async function generateCodeForQQ(qq: string, password: string) {
    return await createVerificationCode(qq.toString(), password)
}

export default { generateCodeForQQ };
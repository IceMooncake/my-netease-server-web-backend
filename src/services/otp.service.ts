import { createVerificationCode, deleteVerificationCodeByQQ, findVerificationCodeByQQ } from '../repositories/verificationCodes.repo.ts';

async function generateCode(qq: string, password: string) {
    return await createVerificationCode(qq.toString(), password)
}

async function checkIsVerified(qq: string) {
    const row = await findVerificationCodeByQQ(qq)
    
      if (!row || !row.verified) {
        throw new Error('验证码无效');
      }
      deleteVerificationCodeByQQ(qq); // 验证成功删除验证码记录
      return row.password; // 返回已验证状态
}

export default { generateCode, checkIsVerified };
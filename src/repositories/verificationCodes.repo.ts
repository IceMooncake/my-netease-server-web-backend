import { RowDataPacket } from "mysql2"
import { pool } from "../database/mysql.ts";
import { hashPassword } from "../utils/hash.ts";

interface VerificationCode extends RowDataPacket {
    qq: string
    code: string
    expires_at: Date
    verified: boolean
    created_at: Date
    password: string
}

export async function findVerificationCodeByQQ(qq: string): Promise<VerificationCode | null> {
    const [rows] = await pool.query<VerificationCode[]>('SELECT * FROM verification_codes WHERE qq = ?', [qq]);
    return rows[0] || null;
}

export async function deleteVerificationCodeByQQ(qq: string): Promise<void> {
    await pool.query('DELETE FROM verification_codes WHERE qq = ?', [qq]);
}

export async function createVerificationCode(qq: string, password: string): Promise<string> {
    const existingCode = await findVerificationCodeByQQ(qq);
    // 如果没有验证码或现有验证码未过期，则生成新的验证码
    if (existingCode === null || (existingCode && (new Date() > new Date(existingCode.expires_at)))) {
        if (existingCode) await deleteVerificationCodeByQQ(qq)
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟后过期
        const hashedPassword = await hashPassword(password);
        await pool.query(
            `INSERT INTO verification_codes (qq, code, expires_at, password, verified) VALUES (?, ?, ?, ?, FALSE)`,
            [qq, code, expiresAt, hashedPassword]
        );
        return code
    }
    // 如果现有验证码未过期，直接返回
    return existingCode.code
}

export async function verifyCode(qq: string, code: string): Promise<boolean> {
    const [rows] = await pool.query<VerificationCode[]>(
        'SELECT * FROM verification_codes WHERE qq = ? AND code = ? AND verified = FALSE',
        [qq, code]
    );
    // if (rows.length === 0) throw new Error('验证码无效');
    if (rows.length === 0) return false;
    const verificationCode = rows[0];
    if (new Date(verificationCode.expires_at) < new Date()) {
        throw new Error('验证码已过期');
    }
    // 标记为已验证
    await pool.query(
        'UPDATE verification_codes SET verified = TRUE WHERE qq = ? AND code = ?',
        [qq, code]
    );
    return true;
}
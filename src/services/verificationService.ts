import { RowDataPacket } from 'mysql2';
import { db } from '../config/mysql.ts';

interface VerificationRow extends RowDataPacket {
  code: string;
  expires_at: Date; // 如果是 DATETIME
}

export async function generateCodeForQQ(qq: number, password: string) {
    const [rows] = await db.execute<VerificationRow[]>(
        `SELECT code, expires_at FROM verification_codes WHERE qq = ? AND verified = FALSE`,
        [qq]
    );

    if (rows.length && new Date(rows[0].expires_at) > new Date()) {
        return rows[0].code; // 返回旧验证码
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟后过期

    await db.execute(
        `REPLACE INTO verification_codes (qq, code, expires_at, password, verified) VALUES (?, ?, ?, ?, FALSE)`,
        [qq, code, expiresAt, password]
    );

    return code;
}

import { db } from '../config/mysql.js';

export async function generateCodeForQQ(qq, password) {
    const [rows] = await db.execute(
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

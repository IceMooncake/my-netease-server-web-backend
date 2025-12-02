import { pool } from '../config/mysql.ts'
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface GroupMember extends RowDataPacket {
    qq: string
    status: number // 0: left, 1: active
    joined_at?: Date
    updated_at?: Date
}

export async function findAllGroupMembers(): Promise<GroupMember[]> {
    const [rows] = await pool.query<GroupMember[]>('SELECT qq, status FROM group_members');
    return rows
}

export async function findGroupMemberByQQ(qq: string): Promise<GroupMember | null> {
    const [rows] = await pool.query<GroupMember[]>('SELECT * FROM group_members WHERE qq = ?', [qq])
    return rows[0] || null;
}

export async function createGroupMember(qq: string, status: number): Promise<number> {
    const existingMember = await findGroupMemberByQQ(qq);
    if (existingMember) {
        throw new Error('群成员已存在');
    }
    const [result] = await pool.query<ResultSetHeader>('INSERT INTO group_members (qq, status) VALUES (?, ?)', [qq, status])
    return result.insertId;
}

export async function updateGroupMemberStatus(qq: string, status: number): Promise<void> {
    const member = await findGroupMemberByQQ(qq);
    if (!member) {
        throw new Error('群成员不存在');
    }
    await pool.query('UPDATE group_members SET status = ?, update_at = ? WHERE qq = ?', [status, new Date(), qq])
}

export async function deleteLeaveMembers(): Promise<void> {
    await pool.query('DELETE FROM group_members WHERE status = 0')
}

import bcrypt from 'bcrypt';

export const hashPassword = async (plain: string) => await bcrypt.hash(plain, 10);
export const comparePassword = async (plain: string, hashed: string | null) => {
    if (hashed === null) return false
    return await bcrypt.compare(plain, hashed)
};

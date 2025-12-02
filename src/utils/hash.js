import bcrypt from 'bcrypt';

export const hashPassword = async (plain) => await bcrypt.hash(plain, 10);
export const comparePassword = async (plain, hashed) => await bcrypt.compare(plain, hashed);

import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

const hashPassword = async (password: string) => {
    const saltRounds = Number(process.env.SALT)
    return await bcrypt.hash(password, saltRounds)
};

const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
};

export { hashPassword, comparePassword };

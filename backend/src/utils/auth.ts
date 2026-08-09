import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { config } from "../config/config";

export const generateToken = (payload: { id: string; email: string; role: "user" | "admin" }): string => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn as any });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, config.jwt.secret);
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

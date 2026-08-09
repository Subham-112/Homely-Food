import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { config } from "../config/config";

export const generateAccessToken = (payload: { _id: string; email?: string; phone?: string; role: string }): string => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: `${config.jwt.accessMaxAge}d` as any });
};

export const generateRefreshToken = (payload: { _id: string; email?: string; phone?: string; role: string }): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: `${config.jwt.refreshMaxAge}d` as any });
};

export const verifyToken = (token: string, isRefresh = false): any => {
  const secret = isRefresh ? config.jwt.refreshSecret : config.jwt.secret;
  return jwt.verify(token, secret);
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

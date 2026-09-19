import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { config } from "../config/config";

export const requireInternalAuth = (req: Request, res: Response, next: NextFunction) => {
  const providedKey = req.headers["x-internal-api-key"] as string;
  const expectedKey = config.internalApiSecret;

  if (!providedKey || !expectedKey) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Missing internal API authentication key",
    });
  }

  const providedBuffer = Buffer.from(providedKey);
  const expectedBuffer = Buffer.from(expectedKey);

  // Constant-time comparison to prevent timing side-channel attacks
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Invalid internal API credentials",
    });
  }

  next();
};

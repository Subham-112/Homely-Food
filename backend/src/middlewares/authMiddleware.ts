import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt, { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";
import { User } from "../models/user.model";
import Admin from "../models/admin.model";
import { config } from "../config/config";
import { generateAccessToken } from "../utils/token";

const ROLES = ["admin", "guest", "owner", "staff", "system", "user"] as const;
export type Role = (typeof ROLES)[number];

export interface AuthenticatedRequest extends Request {
  user?: {
    role: Role;
    _id: string;
    email?: string;
    mobile?: string;
  };
}

const isRole = (val: unknown): val is Role =>
  typeof val === "string" && ROLES.some((role) => role === val);

// Helper mapping supported roles to their Mongoose models for refresh-token verification
const getUserByRole = async (role: Role, id: string) => {
  const modelMap: Partial<Record<Role, any>> = {
    admin: Admin,
    user: User,
    guest: User,
    system: Admin,
  };
  const Model = modelMap[role];
  return Model ? Model.findById(id) : null;
};

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const accessToken = req.header("Authorization")?.replace("Bearer ", "");
  const refreshToken = req.cookies?.refreshToken;

  if (!accessToken) {
    return res
      .status(401)
      .json({ success: false, status: 401, message: "Access token missing." });
  }

  try {
    const decoded = jwt.verify(accessToken, config.jwt.secret) as {
      _id?: string;
      role?: string;
      email?: string;
      mobile?: string;
      sub?: string;
    };

    const subject = decoded._id || decoded.sub;
    if (!subject) {
      return res
        .status(401)
        .json({ success: false, status: 401, message: "Malformed token (missing subject)." });
    }

    const tokenRole: Role = isRole(decoded.role) ? decoded.role : "user";

    if (tokenRole === "admin") {
      const admin = await Admin.findById(subject).select("_id email status").lean();
      if (!admin || admin.status !== "active") {
        return res
          .status(401)
          .json({ success: false, status: 401, message: "Invalid or inactive admin account." });
      }
    } else if (tokenRole === "user") {
      const user = await User.findById(subject).select("_id email status").lean();
      if (!user || user.status !== "active") {
        return res
          .status(401)
          .json({ success: false, status: 401, message: "Invalid or inactive account." });
      }
    }

    (req as AuthenticatedRequest).user = {
      role: tokenRole,
      _id: subject,
      email: decoded.email,
      mobile: decoded.mobile,
    };

    return next();
  } catch (err) {
    // Attempt silent refresh only if access token expired and refresh token cookie exists
    if (err instanceof TokenExpiredError && refreshToken) {
      try {
        const decodedRefresh = jwt.verify(
          refreshToken,
          config.jwt.refreshSecret
        ) as { _id?: string; role?: string; email?: string; sub?: string };

        const subject = decodedRefresh._id || decodedRefresh.sub;
        const tokenRole: Role = isRole(decodedRefresh.role) ? decodedRefresh.role : "user";
        if (!subject) {
          return res
            .status(403)
            .json({ success: false, status: 403, message: "Invalid refresh token (no subject)." });
        }

        const user = await getUserByRole(tokenRole, subject);

        if (!user || user.refreshToken !== refreshToken || user.status !== "active") {
          return res
            .status(403)
            .json({ success: false, status: 403, message: "Invalid refresh token." });
        }

        // Issue new access token and return in response header
        const newAccessToken = generateAccessToken({
          email: user.email,
          _id: String(user._id),
          role: tokenRole,
        });

        res.setHeader("Authorization", `Bearer ${newAccessToken}`);
        (req as AuthenticatedRequest).user = {
          _id: String(user._id),
          role: tokenRole,
          email: user.email,
        };

        return next();
      } catch {
        return res.status(401).json({
          success: false,
          status: 401,
          message: "Session expired. Please log in again.",
        });
      }
    }

    const msg =
      err instanceof JsonWebTokenError
        ? "Invalid access token."
        : "Invalid or expired access token.";
    return res.status(401).json({ success: false, status: 401, message: msg });
  }
};

export const authorize =
  (...allowedRoles: Role[]): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({
        success: false,
        status: 401,
        message: "Unauthorized. Please log in.",
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        status: 403,
        message: `Forbidden: Your role '${user.role}' does not have permission to access this resource.`,
        allowedRoles,
      });
      return;
    }

    return next();
  };

export const userAccess = [authenticateToken, authorize("user", "admin")];
export const adminAccess = [authenticateToken, authorize("admin")];

import { Request, Response, NextFunction } from "express";
import { AdminService } from "./admin.service";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";
import { config } from "../../config/config";
import { z } from "zod";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .regex(/\d/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const getCookieOptions = (maxAgeInDays: number) => ({
  httpOnly: true,
  secure: config.env === "production",
  sameSite: (config.env === "production" ? "none" : "lax") as "none" | "lax",
  maxAge: maxAgeInDays * 24 * 60 * 60 * 1000,
  path: "/",
});

export class AdminController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = registerSchema.parse(req.body);
      const result = await AdminService.register(validatedData);

      res.cookie("refreshToken", result.refreshToken, getCookieOptions(config.jwt.refreshMaxAge));

      res
        .status(201)
        .json(
          new ApiResponse(
            201,
            { admin: result.admin, accessToken: result.accessToken },
            "Admin registered successfully"
          )
        );
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ApiError(400, error.errors.map((e) => e.message).join(". "), null, error.errors));
        return;
      }
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await AdminService.login(validatedData);

      res.cookie("refreshToken", result.refreshToken, getCookieOptions(config.jwt.refreshMaxAge));

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { admin: result.admin, accessToken: result.accessToken },
            "Admin logged in successfully"
          )
        );
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ApiError(400, error.errors.map((e) => e.message).join(". "), null, error.errors));
        return;
      }
      next(error);
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user._id) {
        throw new ApiError(401, "Unauthorized. Admin ID missing.");
      }
      await AdminService.logout(req.user._id);

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: config.env === "production",
        sameSite: (config.env === "production" ? "none" : "lax") as "none" | "lax",
        path: "/",
      });

      res.status(200).json(new ApiResponse(200, null, "Admin logged out successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user._id) {
        throw new ApiError(401, "Unauthorized. Admin ID missing.");
      }
      const profile = await AdminService.getProfile(req.user._id);
      res.status(200).json(new ApiResponse(200, profile, "Admin profile fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async isEmailExists(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const email = typeof req.query.email === "string" ? req.query.email : (req.body?.email as string);
      if (!email || email.trim().length === 0) {
        throw new ApiError(400, "Email address is required");
      }
      const exists = await AdminService.isEmailExists(email.trim());
      res.status(200).json(new ApiResponse(200, { exists }, exists ? "Email exists" : "Email not found"));
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, newPassword } = req.body;
      if (!email || !email.trim()) {
        throw new ApiError(400, "Email address is required");
      }
      if (!newPassword || newPassword.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters long");
      }
      await AdminService.resetPassword({ email: email.trim(), newPassword });
      res.status(200).json(new ApiResponse(200, null, "Password reset successfully"));
    } catch (error) {
      next(error);
    }
  }
}

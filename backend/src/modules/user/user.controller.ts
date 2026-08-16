import { Request, Response, NextFunction } from "express";
import { UserService } from "./user.service";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";
import { config } from "../../config/config";
import { z } from "zod";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .regex(/\d/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
});

const loginSchema = z.object({
  phone: z.string().min(1, "Phone number is required"),
  password: z.string().min(1, "Password is required"),
});

const getCookieOptions = (maxAgeInDays: number) => ({
  httpOnly: true,
  secure: config.env === "production",
  sameSite: (config.env === "production" ? "none" : "lax") as "none" | "lax",
  maxAge: maxAgeInDays * 24 * 60 * 60 * 1000,
  path: "/",
});

export class UserController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = registerSchema.parse(req.body);
      const result = await UserService.register(validatedData);

      res.cookie("refreshToken", result.refreshToken, getCookieOptions(config.jwt.refreshMaxAge));

      res
        .status(201)
        .json(
          new ApiResponse(
            201,
            { user: result.user, accessToken: result.accessToken },
            "User registered successfully"
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
      const result = await UserService.login(validatedData);

      res.cookie("refreshToken", result.refreshToken, getCookieOptions(config.jwt.refreshMaxAge));

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { user: result.user, accessToken: result.accessToken },
            "User logged in successfully"
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
        throw new ApiError(401, "Unauthorized. User ID missing.");
      }
      await UserService.logout(req.user._id);

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: config.env === "production",
        sameSite: (config.env === "production" ? "none" : "lax") as "none" | "lax",
        path: "/",
      });

      res.status(200).json(new ApiResponse(200, null, "User logged out successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user._id) {
        throw new ApiError(401, "Unauthorized. User ID missing.");
      }
      const profile = await UserService.getProfile(req.user._id);
      res.status(200).json(new ApiResponse(200, profile, "Profile fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user._id) {
        throw new ApiError(401, "Unauthorized. User ID missing.");
      }
      const { name, email, phone, avatar } = req.body;
      const updatedProfile = await UserService.updateProfile(req.user._id, { name, email, phone, avatar });
      res.status(200).json(new ApiResponse(200, updatedProfile, "Profile updated successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async searchByPhone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const phone = typeof req.query.phone === "string" ? req.query.phone : "";
      const users = await UserService.searchByPhone(phone);
      res.status(200).json(new ApiResponse(200, users, "Users fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async isPhoneExists(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const phone = typeof req.query.phone === "string" ? req.query.phone : (req.body?.phone as string);
      if (!phone || phone.trim().length === 0) {
        throw new ApiError(400, "Phone number is required");
      }
      const exists = await UserService.isPhoneExists(phone.trim());
      res.status(200).json(new ApiResponse(200, { exists }, exists ? "Phone number exists" : "Phone number not found"));
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone, newPassword } = req.body;
      if (!phone || !phone.trim()) {
        throw new ApiError(400, "Phone number is required");
      }
      if (!newPassword || newPassword.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters long");
      }
      await UserService.resetPassword({ phone: phone.trim(), newPassword });
      res.status(200).json(new ApiResponse(200, null, "Password reset successfully"));
    } catch (error) {
      next(error);
    }
  }
}

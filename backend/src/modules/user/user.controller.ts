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
}

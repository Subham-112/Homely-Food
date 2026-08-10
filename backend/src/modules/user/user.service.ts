import User from "../../models/user.model";
import { hashPassword, comparePassword } from "../../utils/auth";
import { generateAccessToken, generateRefreshToken } from "../../utils/token";
import ApiError from "../../utils/ApiError";

export class UserService {
  static async register(payload: { name: string; phone: string; email?: string; password?: string }) {
    const existingUser = await User.findOne({ phone: payload.phone });
    if (existingUser) {
      throw new ApiError(400, `An account with the phone number "${payload.phone}" already exists.`);
    }

    if (payload.email) {
      const existingEmail = await User.findOne({ email: payload.email.toLowerCase() });
      if (existingEmail) {
        throw new ApiError(400, `An account with the email "${payload.email}" already exists.`);
      }
    }

    const hashedPassword = await hashPassword(payload.password || "123456");
    const user = await User.create({
      name: payload.name,
      phone: payload.phone,
      email: payload.email ? payload.email.toLowerCase() : "",
      password: hashedPassword,
      role: "user",
      status: "active",
    });

    const accessToken = generateAccessToken({ _id: user._id.toString(), phone: user.phone, email: user.email, role: "user" });
    const refreshToken = generateRefreshToken({ _id: user._id.toString(), phone: user.phone, email: user.email, role: "user" });

    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    };
  }

  static async login(payload: { phone: string; password?: string }) {
    const user = await User.findOne({ phone: payload.phone }).select("+password");
    if (!user) {
      throw new ApiError(404, "User not found with this phone number");
    }

    if (payload.password && user.password) {
      const isMatch = await comparePassword(payload.password, user.password);
      if (!isMatch) {
        throw new ApiError(401, "Invalid phone number or password");
      }
    }

    if (user.status !== "active") {
      throw new ApiError(403, "Your account is not active. Please contact support.");
    }

    const accessToken = generateAccessToken({ _id: user._id.toString(), phone: user.phone, email: user.email, role: "user" });
    const refreshToken = generateRefreshToken({ _id: user._id.toString(), phone: user.phone, email: user.email, role: "user" });

    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    };
  }

  static async logout(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    user.refreshToken = "";
    await user.save();
    return true;
  }

  static async getProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    return user;
  }
}

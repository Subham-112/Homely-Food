import Admin from "../../modals/admin.model";
import { hashPassword, comparePassword } from "../../utils/auth";
import { generateAccessToken, generateRefreshToken } from "../../utils/token";
import ApiError from "../../utils/ApiError";

export class AdminService {
  static async register(payload: { name: string; email: string; password?: string }) {
    const existingAdmin = await Admin.findOne({ email: payload.email.toLowerCase() });
    if (existingAdmin) {
      throw new ApiError(400, `An admin account with the email "${payload.email}" already exists.`);
    }

    const hashedPassword = await hashPassword(payload.password || "admin123");
    const admin = await Admin.create({
      name: payload.name,
      email: payload.email.toLowerCase(),
      password: hashedPassword,
      role: "admin",
      status: "active",
      permissions: ["manage_menu", "manage_orders", "manage_users"],
    });

    const accessToken = generateAccessToken({ _id: admin._id.toString(), email: admin.email, role: "admin" });
    const refreshToken = generateRefreshToken({ _id: admin._id.toString(), email: admin.email, role: "admin" });

    admin.refreshToken = refreshToken;
    await admin.save();

    return {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        permissions: admin.permissions,
      },
      accessToken,
      refreshToken,
    };
  }

  static async login(payload: { email: string; password?: string }) {
    const admin = await Admin.findOne({ email: payload.email.toLowerCase() }).select("+password");
    if (!admin) {
      throw new ApiError(401, "Invalid admin credentials");
    }

    if (payload.password && admin.password) {
      const isMatch = await comparePassword(payload.password, admin.password);
      if (!isMatch) {
        throw new ApiError(401, "Invalid admin credentials");
      }
    }

    if (admin.status !== "active") {
      throw new ApiError(403, "Your admin account is not active.");
    }

    const accessToken = generateAccessToken({ _id: admin._id.toString(), email: admin.email, role: "admin" });
    const refreshToken = generateRefreshToken({ _id: admin._id.toString(), email: admin.email, role: "admin" });

    admin.refreshToken = refreshToken;
    await admin.save();

    return {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        permissions: admin.permissions,
      },
      accessToken,
      refreshToken,
    };
  }

  static async logout(adminId: string) {
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new ApiError(404, "Admin not found");
    }
    admin.refreshToken = "";
    await admin.save();
    return true;
  }

  static async getProfile(adminId: string) {
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new ApiError(404, "Admin not found");
    }
    return admin;
  }
}

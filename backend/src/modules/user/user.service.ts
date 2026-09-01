import User from "../../models/user.model";
import { Customer } from "../../models/customer.model";
import { hashPassword, comparePassword } from "../../utils/auth";
import { generateAccessToken, generateRefreshToken } from "../../utils/token";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { CoinService } from "../coin/coin.service";

export class UserService {
  static async register(payload: {
    name: string;
    phone: string;
    email?: string;
    password?: string;
    agreedPrivacyPolicy?: boolean;
    agreedTermsAndConditions?: boolean;
  }) {
    const existingUser = await User.findOne({ phone: payload.phone });
    if (existingUser) {
      throw new ApiError(400, `An account with the phone number "${payload.phone}" already exists.`);
    }

    const cleanEmail = payload.email && payload.email.trim() ? payload.email.trim().toLowerCase() : undefined;
    if (cleanEmail) {
      const existingEmail = await User.findOne({ email: cleanEmail });
      if (existingEmail) {
        throw new ApiError(400, `An account with the email "${payload.email}" already exists.`);
      }
    }

    const hashedPassword = await hashPassword(payload.password || "123456");
    const user = await User.create({
      name: payload.name,
      phone: payload.phone,
      ...(cleanEmail ? { email: cleanEmail } : {}),
      password: hashedPassword,
      role: "user",
      status: "active",
      agreedPrivacyPolicy: payload.agreedPrivacyPolicy ?? true,
      agreedTermsAndConditions: payload.agreedTermsAndConditions ?? true,
    });

    const accessToken = generateAccessToken({ _id: user._id.toString(), phone: user.phone, email: user.email, role: "user" });
    const refreshToken = generateRefreshToken({ _id: user._id.toString(), phone: user.phone, email: user.email, role: "user" });

    user.refreshToken = refreshToken;
    await user.save();

    // Create Customer profile for the registered user
    try {
      let customer = await Customer.findOne({ phone: user.phone });
      if (!customer) {
        customer = new Customer({
          phone: user.phone,
          user: user._id,
          primaryName: user.name,
          names: [{ name: user.name, addedAt: new Date() }],
          orderCount: 0,
          totalExpenses: 0,
          customerType: "registered",
        });
        await customer.save();
      } else {
        let needsUpdate = false;
        if (!customer.user) {
          customer.user = user._id;
          needsUpdate = true;
        }
        if (customer.customerType !== "registered") {
          customer.customerType = "registered";
          needsUpdate = true;
        }
        if (needsUpdate) {
          await customer.save();
        }
      }
    } catch (custError) {
      console.error("Failed to create customer profile during user register:", custError);
    }

    // Award 50 Welcome Coins for first-time registration
    try {
      await CoinService.grantWelcomeBonus(user._id.toString());
    } catch (coinError) {
      console.error("Failed to grant welcome bonus during user register:", coinError);
    }

    return {
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        welcomeRewardClaimed: user.welcomeRewardClaimed || false,
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
        welcomeRewardClaimed: user.welcomeRewardClaimed || false,
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
    user.refreshToken = undefined;
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

  static async updateProfile(userId: string, payload: { name?: string; email?: string; phone?: string; avatar?: string }) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (payload.email !== undefined) {
      const cleanEmail = payload.email.trim().toLowerCase();
      if (cleanEmail === "") {
        user.email = undefined;
      } else if (cleanEmail !== user.email) {
        const existingEmail = await User.findOne({ email: cleanEmail, _id: { $ne: userId } });
        if (existingEmail) {
          throw new ApiError(400, `An account with the email "${payload.email}" already exists.`);
        }
        user.email = cleanEmail;
      }
    }

    if (payload.phone && payload.phone !== user.phone) {
      const existingPhone = await User.findOne({ phone: payload.phone, _id: { $ne: userId } });
      if (existingPhone) {
        throw new ApiError(400, `An account with the phone number "${payload.phone}" already exists.`);
      }
      user.phone = payload.phone;
    }

    if (payload.name) {
      user.name = payload.name;
    }

    if (payload.avatar !== undefined) {
      user.avatar = payload.avatar;
    }

    await user.save();

    // Sync Customer primaryName if name or phone changed
    try {
      const customer = await Customer.findOne({ user: user._id });
      if (customer) {
        if (payload.name) customer.primaryName = payload.name;
        if (payload.phone) customer.phone = payload.phone;
        await customer.save();
      }
    } catch (err) {
      console.error("Failed to sync customer profile on updateProfile:", err);
    }

    return user;
  }

  static async searchByPhone(phone: string) {
    if (!phone || !phone.trim()) return [];

    const searchRegex = { $regex: phone.trim(), $options: "i" };

    // 1. Search in User model first
    const users = await User.find({ phone: searchRegex }).select("_id name phone email").limit(10);

    if (users && users.length > 0) {
      return users.map((u) => ({
        id: u._id.toString(),
        _id: u._id.toString(),
        name: u.name,
        phone: u.phone,
        email: u.email,
        userId: u._id.toString(),
      }));
    }

    // 2. If no User found, fallback search in Customer model
    const customers = await Customer.find({ phone: searchRegex }).limit(10);

    return customers.map((c) => ({
      id: c.user ? c.user.toString() : c._id.toString(),
      _id: c.user ? c.user.toString() : c._id.toString(),
      name: c.primaryName,
      phone: c.phone,
      userId: c.user ? c.user.toString() : c._id.toString(),
      orderCount: c.orderCount,
      totalExpenses: c.totalExpenses,
    }));
  }

  static async isPhoneExists(phone: string): Promise<boolean> {
    const userExists = await User.exists({ phone });
    return !!userExists;
  }

  static async resetPassword(payload: { phone: string; newPassword?: string }) {
    const user = await User.findOne({ phone: payload.phone }).select("+password");
    if (!user) {
      throw new ApiError(404, "User not found with this phone number.");
    }

    if (!payload.newPassword || payload.newPassword.length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters long.");
    }

    if (user.password) {
      const isSamePassword = await comparePassword(payload.newPassword, user.password);
      if (isSamePassword) {
        throw new ApiError(400, "New password cannot be the same as your old password.");
      }
    }

    const hashedPassword = await hashPassword(payload.newPassword);
    user.password = hashedPassword;
    await user.save();
    return true;
  }
}

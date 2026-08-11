import User from "../../models/user.model";
import { Customer } from "../../models/customer.model";
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

  static async searchByPhone(phone: string) {
    if (!phone || !phone.trim()) return [];

    const searchRegex = { $regex: phone.trim(), $options: "i" };

    // Query both collections in parallel
    const [customers, users] = await Promise.all([
      Customer.find({ phone: searchRegex }).limit(10),
      User.find({ phone: searchRegex }).select("_id name phone email").limit(10),
    ]);

    // Use a Map to merge suggestions by phone number to avoid duplicates
    const resultsMap = new Map<string, any>();

    // 1. Add Customer profile records
    for (const c of customers) {
      resultsMap.set(c.phone, {
        _id: c._id.toString(), // Customer ID
        name: c.primaryName,
        phone: c.phone,
        userId: c.user ? c.user.toString() : undefined,
        orderCount: c.orderCount,
        totalExpenses: c.totalExpenses,
      });
    }

    // 2. Add User records (for users who haven't ordered yet or are missing from Customer)
    for (const u of users) {
      if (!resultsMap.has(u.phone)) {
        resultsMap.set(u.phone, {
          _id: u._id.toString(), // User ID
          name: u.name,
          phone: u.phone,
          userId: u._id.toString(),
          orderCount: 0,
          totalExpenses: 0,
        });
      } else {
        const existing = resultsMap.get(u.phone);
        if (!existing.userId) {
          existing.userId = u._id.toString();
        }
      }
    }

    return Array.from(resultsMap.values());
  }
}

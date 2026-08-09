import { config } from "../config/config";
import { Mongoose } from "../config/database";
import Admin from "../modals/admin.model";
import { hashPassword } from "../utils/auth";

const email = config.admin.email;
const pass = config.admin.password;

const seedAdmin = async () => {
  try {
    if (!email || !pass) {
      throw new Error("Email or Password is required")
    }
    await Mongoose.connect();

    const adminEmail = email;
    const adminPassword = pass;
    const adminName = "Homly Foods Admin";

    const existingAdmin = await Admin.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`⚠️ Admin with email ${adminEmail} already exists.`);
    } else {
      const hashedPassword = await hashPassword(adminPassword);
      await Admin.create({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        status: "active",
        permissions: ["manage_menu", "manage_orders", "manage_users"],
      });
      console.log("✅ Admin user seeded successfully!");
    }
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
  } finally {
    await Mongoose.disConnect();
    process.exit(0);
  }
};

seedAdmin();

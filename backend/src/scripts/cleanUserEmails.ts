import { Mongoose } from "../config/database";
import User from "../models/user.model";

const cleanUserEmails = async () => {
  try {
    await Mongoose.connect();
    console.log("🔌 Connected to Database. Cleaning user emails...");

    // 1. Drop existing strict index FIRST so MongoDB doesn't throw E11000 duplicate key error while setting/updating documents
    try {
      await User.collection.dropIndex("email_1");
      console.log("🗑️ Dropped old non-sparse/stale email_1 index from MongoDB collection.");
    } catch (indexErr: any) {
      console.log("ℹ️ Note on index drop (if index didn't exist):", indexErr?.message || indexErr);
    }

    // 2. Remove email field where email is empty string "", null, or whitespace only
    const unsetResult = await User.collection.updateMany(
      {
        $or: [
          { email: "" },
          { email: null },
          { email: { $exists: true, $type: "string", $regex: "^\\s*$" } },
        ],
      },
      {
        $unset: { email: "" },
      }
    );

    console.log(`✅ Unset email field from ${unsetResult.modifiedCount} user documents (matching empty/null values).`);

    // 3. Re-create clean sparse unique index
    await User.collection.createIndex({ email: 1 }, { unique: true, sparse: true });
    console.log("✨ Successfully created clean sparse unique index on email!");

    console.log("🎉 User email cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Error during user email cleanup:", error);
  } finally {
    await Mongoose.disConnect();
    process.exit(0);
  }
};

cleanUserEmails();

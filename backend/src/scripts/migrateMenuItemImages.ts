import mongoose from "mongoose";
import { config } from "../config/config";

const migrateMenuItemImages = async () => {
  const dbUrl = config.db.url;
  const dbName = config.db.name;
  const connectionUrl = `${dbUrl}/${dbName}`;

  console.log("🚀 Starting MenuItem images migration...");
  console.log(`📡 Connecting to MongoDB at ${dbUrl}/${dbName}...`);

  try {
    await mongoose.connect(connectionUrl);
    console.log("✅ Connected to MongoDB successfully.");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Failed to get MongoDB database instance.");
    }

    const collection = db.collection("menuitems");
    const allItems = await collection.find({}).toArray();

    console.log(`📦 Found ${allItems.length} total menu items in database.`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const item of allItems) {
      const rawImage = item.image;

      // Case 1: image is stored directly as a string
      if (typeof rawImage === "string") {
        const trimmedUrl = rawImage.trim();
        if (trimmedUrl) {
          await collection.updateOne(
            { _id: item._id },
            {
              $set: {
                image: {
                  url: trimmedUrl,
                },
              },
            }
          );
          console.log(`✨ Migrated [${item._id}] "${item.name}": "${trimmedUrl}" -> { url: "${trimmedUrl}" }`);
          migratedCount++;
        } else {
          await collection.updateOne(
            { _id: item._id },
            {
              $unset: { image: "" },
            }
          );
          console.log(`🧹 Cleaned empty string image for [${item._id}] "${item.name}"`);
          migratedCount++;
        }
      }
      // Case 2: image is already an object or null/undefined
      else if (rawImage && typeof rawImage === "object" && typeof rawImage.url === "string") {
        skippedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log("\n=================================");
    console.log("🎉 Migration Summary:");
    console.log(`   Total items processed: ${allItems.length}`);
    console.log(`   Items migrated/fixed : ${migratedCount}`);
    console.log(`   Items already valid  : ${skippedCount}`);
    console.log("=================================\n");
  } catch (error) {
    console.error("❌ Migration failed with error:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB.");
    process.exit(0);
  }
};

migrateMenuItemImages();

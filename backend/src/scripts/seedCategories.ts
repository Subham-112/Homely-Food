import { Mongoose } from "../config/database";
import Category from "../models/category.model";
import { CategoryStatus } from "../common/enum";

const categoriesToSeed = [
  {
    name: "Thali",
    slug: "thali",
    description: "Complete nutritious home-style Indian meal thalis with roti, sabzi, dal, and rice.",
    status: CategoryStatus.ACTIVE,
  },
  {
    name: "Breakfast",
    slug: "breakfast",
    description: "Freshly prepared morning dishes including Poha, Parathas, and Upma.",
    status: CategoryStatus.ACTIVE,
  },
  {
    name: "Lunch",
    slug: "lunch",
    description: "Hearty afternoon curries, rice dishes, and freshly made breads.",
    status: CategoryStatus.ACTIVE,
  },
  {
    name: "Snacks",
    slug: "snacks",
    description: "Light bites, samosas, kachoris, and evening tea time refreshers.",
    status: CategoryStatus.ACTIVE,
  },
  {
    name: "Beverages",
    slug: "beverages",
    description: "Refreshing drinks like Masala Lassi, Chaas, and Adrak Chai.",
    status: CategoryStatus.ACTIVE,
  },
];

const seedCategories = async () => {
  try {
    await Mongoose.connect();

    for (const cat of categoriesToSeed) {
      const existingCategory = await Category.findOne({ slug: cat.slug });
      if (existingCategory) {
        console.log(`⚠️ Category "${cat.name}" already exists.`);
      } else {
        await Category.create(cat);
        console.log(`✅ Seeded Category: "${cat.name}"`);
      }
    }

    // Unset image field from all existing category documents in MongoDB
    const result = await Category.updateMany({}, { $unset: { image: 1 } });
    console.log(`🗑️ Removed image field from ${result.modifiedCount} existing categories in DB.`);

    console.log("🎉 Category seeding and cleanup completed!");
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
  } finally {
    await Mongoose.disConnect();
    process.exit(0);
  }
};

seedCategories();

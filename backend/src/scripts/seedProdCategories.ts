import { Mongoose } from "../config/database";
import Category from "../models/category.model";
import { CategoryStatus } from "../common/enum";

export const prodCategories = [
  {
    name: "Starter",
    slug: "starter",
    description: "Crispy and delicious vegetarian starters and skewers.",
    status: CategoryStatus.ACTIVE,
  },
  {
    name: "Sandwich",
    slug: "sandwich",
    description: "Freshly grilled cheesy sandwiches.",
    status: CategoryStatus.ACTIVE,
  },
  {
    name: "Momo",
    slug: "momo",
    description: "Authentic steamed, fried, and crispy paneer momos.",
    status: CategoryStatus.ACTIVE,
  },
  {
    name: "Dinner",
    slug: "dinner",
    description: "Homely Indian dinner rotis, parathas, curries, and gravies.",
    status: CategoryStatus.ACTIVE,
  },
];

const seedProdCategories = async () => {
  try {
    await Mongoose.connect();
    console.log("Connecting to Database for Prod Categories Seeding...");

    for (const cat of prodCategories) {
      const existingCategory = await Category.findOne({ slug: cat.slug });
      if (existingCategory) {
        existingCategory.name = cat.name;
        existingCategory.description = cat.description;
        existingCategory.status = cat.status;
        await existingCategory.save();
        console.log(`🔄 Updated existing Category: "${cat.name}"`);
      } else {
        await Category.create(cat);
        console.log(`✅ Seeded New Category: "${cat.name}"`);
      }
    }

    console.log("🎉 Production Categories Seeding Completed Successfully!");
  } catch (error) {
    console.error("❌ Error seeding production categories:", error);
  } finally {
    await Mongoose.disConnect();
    process.exit(0);
  }
};

if (require.main === module) {
  seedProdCategories();
}

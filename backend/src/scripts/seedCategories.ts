import { Mongoose } from "../config/database";
import Category from "../models/category.model";
import { CategoryStatus } from "../common/enum";

const categoriesToSeed = [
  {
    name: "Thali",
    slug: "thali",
    description: "Complete nutritious home-style Indian meal thalis with roti, sabzi, dal, and rice.",
    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80",
    status: CategoryStatus.ACTIVE,
  },
  {
    name: "Breakfast",
    slug: "breakfast",
    description: "Freshly prepared morning dishes including Poha, Parathas, and Upma.",
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    status: CategoryStatus.ACTIVE,
  },
  {
    name: "Lunch",
    slug: "lunch",
    description: "Hearty afternoon curries, rice dishes, and freshly made breads.",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
    status: CategoryStatus.ACTIVE,
  },
  {
    name: "Snacks",
    slug: "snacks",
    description: "Light bites, samosas, kachoris, and evening tea time refreshers.",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    status: CategoryStatus.ACTIVE,
  },
  {
    name: "Beverages",
    slug: "beverages",
    description: "Refreshing drinks like Masala Lassi, Chaas, and Adrak Chai.",
    image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80",
    status: CategoryStatus.ACTIVE,
  },
];

const seedCategories = async () => {
  try {
    await Mongoose.connect();

    for (const cat of categoriesToSeed) {
      const existingCategory = await Category.findOne({ slug: cat.slug });
      if (existingCategory) {
        console.log(`⚠️ Category "${cat.name}" already exists. Skipping.`);
      } else {
        await Category.create(cat);
        console.log(`✅ Seeded Category: "${cat.name}"`);
      }
    }

    console.log("🎉 Category seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
  } finally {
    await Mongoose.disConnect();
    process.exit(0);
  }
};

seedCategories();

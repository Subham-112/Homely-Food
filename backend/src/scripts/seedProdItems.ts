import { Mongoose } from "../config/database";
import Category from "../models/category.model";
import MenuItem from "../models/menuItem.model";
import { MenuItemStatus } from "../common/enum";

export const prodMenuItems = [
  // --- STARTER ---
  {
    name: "Special Podu",
    categorySlug: "starter",
    description: "Signature Homely Foods special podu starter.",
    price: 25,
    preparationTime: 15,
    tags: ["Starter", "Special", "Pure Veg"],
    allergens: [],
    isTodaySpecial: true,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "Paneer Stick",
    categorySlug: "starter",
    description: "Grilled cottage cheese sticks seasoned with Indian spices.",
    price: 25,
    preparationTime: 15,
    tags: ["Starter", "Paneer", "Pure Veg"],
    allergens: ["Dairy"],
    isTodaySpecial: false,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "Mushroom Stick",
    categorySlug: "starter",
    description: "Juicy marinated mushroom skewers roasted to perfection.",
    price: 25,
    preparationTime: 15,
    tags: ["Starter", "Mushroom", "Pure Veg"],
    allergens: [],
    isTodaySpecial: false,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "Soyabean Stick",
    categorySlug: "starter",
    description: "Protein-rich soyabean chunks on skewers with flavorful spices.",
    price: 25,
    preparationTime: 15,
    tags: ["Starter", "Soya", "High Protein", "Pure Veg"],
    allergens: ["Soya"],
    isTodaySpecial: false,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "Potato Sticks",
    categorySlug: "starter",
    description: "Crispy potato sticks fried till golden brown with seasoning.",
    price: 25,
    preparationTime: 12,
    tags: ["Starter", "Potato", "Crispy"],
    allergens: [],
    isTodaySpecial: false,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "Crispy Corn",
    categorySlug: "starter",
    description: "Crunchy sweet corn tossed with capsicum, spices, and lemon juice.",
    price: 40,
    preparationTime: 15,
    tags: ["Starter", "Crispy", "Popular"],
    allergens: [],
    isTodaySpecial: true,
    status: MenuItemStatus.AVAILABLE,
  },

  // --- SANDWICH ---
  {
    name: "Veg Cheesy Sandwich",
    categorySlug: "sandwich",
    description: "Grilled sandwich loaded with fresh garden vegetables and melted cheese.",
    price: 40,
    preparationTime: 12,
    tags: ["Sandwich", "Cheesy", "Pure Veg"],
    allergens: ["Gluten", "Dairy"],
    isTodaySpecial: false,
    status: MenuItemStatus.AVAILABLE,
  },

  // --- MOMO ---
  {
    name: "Steam Paneer Momo",
    categorySlug: "momo",
    description: "Soft steamed dumplings stuffed with spiced paneer filling.",
    price: 30,
    preparationTime: 15,
    tags: ["Momo", "Steamed", "Paneer"],
    allergens: ["Gluten", "Dairy"],
    isTodaySpecial: false,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "Fried Paneer Momo",
    categorySlug: "momo",
    description: "Crispy deep-fried paneer momos served with spicy chutney.",
    price: 40,
    preparationTime: 15,
    tags: ["Momo", "Fried", "Paneer"],
    allergens: ["Gluten", "Dairy"],
    isTodaySpecial: false,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "KFC Paneer Momo",
    categorySlug: "momo",
    description: "Extra crunchy kurkure coated paneer momos with special seasoning.",
    price: 50,
    preparationTime: 18,
    tags: ["Momo", "KFC Style", "Extra Crispy", "Best Seller"],
    allergens: ["Gluten", "Dairy"],
    isTodaySpecial: true,
    status: MenuItemStatus.AVAILABLE,
  },

  // --- DINNER ---
  {
    name: "Tawa Roti",
    categorySlug: "dinner",
    description: "Freshly baked whole wheat flatbread made on tawa.",
    price: 7,
    preparationTime: 8,
    tags: ["Dinner", "Roti", "Breads"],
    allergens: ["Gluten"],
    isTodaySpecial: false,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "Paratha",
    categorySlug: "dinner",
    description: "Layered flaky whole wheat paratha cooked with ghee.",
    price: 10,
    preparationTime: 10,
    tags: ["Dinner", "Paratha", "Breads"],
    allergens: ["Gluten"],
    isTodaySpecial: false,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "Chhole",
    categorySlug: "dinner",
    description: "Spiced North Indian chickpea curry cooked in authentic masala.",
    price: 40,
    preparationTime: 15,
    tags: ["Dinner", "Chhole", "Curry"],
    allergens: [],
    isTodaySpecial: false,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "Dal Fry",
    categorySlug: "dinner",
    description: "Yellow lentils tempered with cumin, garlic, tomatoes, and ghee.",
    price: 40,
    preparationTime: 15,
    tags: ["Dinner", "Dal", "Homely"],
    allergens: [],
    isTodaySpecial: false,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "Navratna Korma",
    categorySlug: "dinner",
    description: "Rich and creamy vegetable curry cooked with mild spices and nuts.",
    price: 60,
    preparationTime: 20,
    tags: ["Dinner", "Korma", "Rich Curry"],
    allergens: ["Dairy", "Nuts"],
    isTodaySpecial: true,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "Ghuguni",
    categorySlug: "dinner",
    description: "Traditional pea curry seasoned with ginger, garlic, and spices.",
    price: 25,
    preparationTime: 15,
    tags: ["Dinner", "Ghuguni", "Traditional"],
    allergens: [],
    isTodaySpecial: false,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "Potal Paneer",
    categorySlug: "dinner",
    description: "Pointed gourd (Parwal) and paneer cubes cooked in a savory gravy.",
    price: 70,
    preparationTime: 20,
    tags: ["Dinner", "Special Curry", "Paneer"],
    allergens: ["Dairy"],
    isTodaySpecial: false,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "Veg Manchurian",
    categorySlug: "dinner",
    description: "Crispy vegetable balls tossed in tangy Manchurian sauce.",
    price: 70,
    preparationTime: 18,
    tags: ["Dinner", "NEW", "Indo-Chinese"],
    allergens: ["Gluten", "Soya"],
    isTodaySpecial: true,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "Chilli Paneer",
    categorySlug: "dinner",
    description: "Cubes of cottage cheese tossed with bell peppers in spicy chilli sauce.",
    price: 70,
    preparationTime: 18,
    tags: ["Dinner", "NEW", "Indo-Chinese", "Paneer"],
    allergens: ["Dairy", "Gluten", "Soya"],
    isTodaySpecial: true,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "Chilli Mushroom",
    categorySlug: "dinner",
    description: "Fresh mushrooms sautéed with capsicum and onions in hot chilli sauce.",
    price: 70,
    preparationTime: 18,
    tags: ["Dinner", "NEW", "Indo-Chinese", "Mushroom"],
    allergens: ["Gluten", "Soya"],
    isTodaySpecial: false,
    status: MenuItemStatus.AVAILABLE,
  },
];

const seedProdItems = async () => {
  try {
    await Mongoose.connect();
    console.log("Connecting to Database for Prod Menu Items Seeding...");

    // Build map of category slugs to _id
    const categoriesInDb = await Category.find();
    const categoryMap: Record<string, any> = {};
    categoriesInDb.forEach((cat) => {
      categoryMap[cat.slug] = cat._id;
    });

    for (const item of prodMenuItems) {
      const categoryId = categoryMap[item.categorySlug];
      if (!categoryId) {
        console.error(`❌ Category with slug "${item.categorySlug}" not found for item "${item.name}". Skipping.`);
        continue;
      }

      const existingItem = await MenuItem.findOne({ name: item.name });
      if (existingItem) {
        existingItem.category = categoryId;
        existingItem.description = item.description;
        existingItem.price = item.price;
        existingItem.preparationTime = item.preparationTime;
        existingItem.tags = item.tags;
        existingItem.allergens = item.allergens;
        existingItem.isTodaySpecial = item.isTodaySpecial;
        existingItem.status = item.status;
        await existingItem.save();
        console.log(`🔄 Updated existing Menu Item: "${item.name}" (₹${item.price})`);
      } else {
        await MenuItem.create({
          name: item.name,
          category: categoryId,
          description: item.description,
          price: item.price,
          preparationTime: item.preparationTime,
          tags: item.tags,
          allergens: item.allergens,
          isTodaySpecial: item.isTodaySpecial,
          status: item.status,
        });
        console.log(`✅ Seeded New Menu Item: "${item.name}" (₹${item.price})`);
      }
    }

    console.log("🎉 Production Menu Items Seeding Completed Successfully!");
  } catch (error) {
    console.error("❌ Error seeding production menu items:", error);
  } finally {
    await Mongoose.disConnect();
    process.exit(0);
  }
};

if (require.main === module) {
  seedProdItems();
}

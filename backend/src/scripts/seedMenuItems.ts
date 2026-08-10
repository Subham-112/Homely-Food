import { Mongoose } from "../config/database";
import Category from "../models/category.model";
import MenuItem from "../models/menuItem.model";
import { MenuItemStatus } from "../common/enum";

const sampleMenuItems = [
  {
    name: "Special North Indian Thali",
    description: "Authentic thali featuring Paneer Butter Masala, Dal Makhani, 3 Butter Roti, Jeera Rice, and Gulab Jamun.",
    price: 180,
    preparationTime: 20,
    tags: ["Thali", "Best Seller", "North Indian"],
    allergens: ["Dairy", "Gluten"],
    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80",
    isTodaySpecial: true,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "Deluxe Gujarati Thali",
    description: "Traditional Gujarati thali with Gujarati Kadhi, Sev Tamatar, Phulka, Steamed Rice, and Sweet.",
    price: 160,
    preparationTime: 20,
    tags: ["Thali", "Gujarati", "Pure Veg"],
    allergens: ["Gluten"],
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
    isTodaySpecial: false,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "Aloo Paratha with Curd & Butter",
    description: "2 whole wheat stuffed Aloo Parathas served hot with fresh curd, butter, and homemade pickle.",
    price: 90,
    preparationTime: 15,
    tags: ["Breakfast", "Paratha"],
    allergens: ["Gluten", "Dairy"],
    image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80",
    isTodaySpecial: false,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "Indori Poha with Jalebi",
    description: "Flattened rice cooked with mustard seeds, turmeric, green chillies, topped with Sev & onion.",
    price: 60,
    preparationTime: 10,
    tags: ["Breakfast", "Snacks", "Popular"],
    allergens: ["Gluten"],
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    isTodaySpecial: true,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "Paneer Butter Masala",
    description: "Cubes of fresh cottage cheese simmered in a rich tomato, butter, and cashew cream gravy.",
    price: 190,
    preparationTime: 15,
    tags: ["Lunch", "Main Course"],
    allergens: ["Dairy", "Nuts"],
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80",
    isTodaySpecial: true,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "Dal Tadka Dhaba Style",
    description: "Yellow lentils tempered with ghee, cumin seeds, garlic, and red chillies.",
    price: 130,
    preparationTime: 12,
    tags: ["Lunch", "Healthy"],
    allergens: ["Dairy"],
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
    isTodaySpecial: false,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "Crispy Samosa (2 Pcs)",
    description: "Golden fried pastry stuffed with spiced potato and green peas mix, served with mint chutney.",
    price: 40,
    preparationTime: 10,
    tags: ["Snacks", "Street Food"],
    allergens: ["Gluten"],
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    isTodaySpecial: false,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "Chole Bhature",
    description: "Spicy chickpea curry paired with 2 fluffy puffed bhatures, pickled onions, and fried green chilli.",
    price: 140,
    preparationTime: 15,
    tags: ["Lunch", "North Indian"],
    allergens: ["Gluten"],
    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80",
    isTodaySpecial: true,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "Masala Chai",
    description: "Traditional Indian tea brewed with fresh ginger, cardamom, clove, and milk.",
    price: 25,
    preparationTime: 8,
    tags: ["Beverages", "Tea"],
    allergens: ["Dairy"],
    image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80",
    isTodaySpecial: false,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "Sweet Punjabi Lassi",
    description: "Thick chilled sweetened yogurt drink topped with fresh cream and cardamom powder.",
    price: 50,
    preparationTime: 5,
    tags: ["Beverages", "Cooler"],
    allergens: ["Dairy"],
    image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80",
    isTodaySpecial: false,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "Veg Dum Biryani",
    description: "Aromatic basmati rice cooked with garden vegetables and exotic spices on dum.",
    price: 170,
    preparationTime: 25,
    tags: ["Lunch", "Biryani"],
    allergens: ["Dairy"],
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    isTodaySpecial: false,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "Butter Naan (2 Pcs)",
    description: "Soft Indian flatbread baked in tandoor and brushed generously with fresh butter.",
    price: 45,
    preparationTime: 10,
    tags: ["Lunch", "Bread"],
    allergens: ["Gluten", "Dairy"],
    image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80",
    isTodaySpecial: false,
    status: MenuItemStatus.AVAILABLE,
  },
  {
    name: "Gulab Jamun (2 Pcs)",
    description: "Soft milk-solid balls fried and soaked in warm sugar syrup infused with rose water.",
    price: 50,
    preparationTime: 5,
    tags: ["Dessert", "Sweet"],
    allergens: ["Dairy", "Gluten"],
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
    isTodaySpecial: false,
    status: MenuItemStatus.AVAILABLE,
  },
];

const seedMenuItems = async () => {
  try {
    await Mongoose.connect();

    // Fetch existing categories
    const categories = await Category.find({ status: "active" });

    if (!categories || categories.length === 0) {
      console.error("❌ No active categories found in database. Please run `npm run seed:categories` first.");
      return;
    }

    console.log(`📋 Found ${categories.length} categories in DB.`);

    for (const item of sampleMenuItems) {
      // Pick a random category from fetched categories
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];

      const existingItem = await MenuItem.findOne({ name: item.name });

      if (existingItem) {
        console.log(`⚠️ MenuItem "${item.name}" already exists. Skipping.`);
      } else {
        await MenuItem.create({
          ...item,
          category: randomCategory._id,
        });
        console.log(`✅ Seeded MenuItem: "${item.name}" -> Category: "${randomCategory.name}"`);
      }
    }

    console.log("🎉 Menu items seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding menu items:", error);
  } finally {
    await Mongoose.disConnect();
    process.exit(0);
  }
};

seedMenuItems();

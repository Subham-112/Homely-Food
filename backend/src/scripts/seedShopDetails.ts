import { Mongoose } from "../config/database";
import ShopDetails from "../models/shopDetails.model";

const seedShopDetails = async () => {
  try {
    await Mongoose.connect();

    const existingDetails = await ShopDetails.findOne();

    if (existingDetails) {
      console.log("⚠️ Shop details already exist in database.");
      console.log(`📌 Shop Name: ${existingDetails.shopName}`);
      console.log(`📌 Owner Name: ${existingDetails.ownerName || ""}`);
      console.log(`📌 Emails: ${existingDetails.emails?.join(", ") || ""}`);
      console.log(`📌 Phones: ${existingDetails.phones?.join(", ") || ""}`);
      console.log(`📌 Serviceable Pincodes: ${existingDetails.serviceablePincodes?.join(", ") || ""}`);
    } else {
      const created = await ShopDetails.create({
        shopName: "Homely Food",
        ownerName: "Homely Food Admin",
        emails: ["support@homelyfood.com", "contact@homelyfood.com"],
        phones: ["9876543210", "9123456789"],
        address: {
          street: "123 Gourmet Street",
          area: "Vesu",
          city: "Surat",
          state: "Gujarat",
          pincode: "395007",
          landmark: "Near Central Mall",
        },
        serviceablePincodes: ["395007", "395001", "395002", "395003", "395004", "395005", "395006"],
        openingTime: "08:00 AM",
        closingTime: "10:00 PM",
        isStoreOpen: true,
        minimumOrderAmount: 100,
        deliveryCharge: 30,
        freeDeliveryThreshold: 500,
      });

      console.log("✅ Shop details seeded successfully!");
      console.log(`📌 Shop Name: ${created.shopName}`);
      console.log(`📌 Owner Name: ${created.ownerName || ""}`);
      console.log(`📌 Emails: ${created.emails?.join(", ") || ""}`);
      console.log(`📌 Phones: ${created.phones?.join(", ") || ""}`);
      console.log(`📌 Serviceable Pincodes: ${created.serviceablePincodes?.join(", ") || ""}`);
    }
  } catch (error) {
    console.error("❌ Error seeding shop details:", error);
  } finally {
    await Mongoose.disConnect();
    process.exit(0);
  }
};

seedShopDetails();

import mongoose from "mongoose";
import dotenv from "dotenv";
import Offer from "../models/offer.model";

dotenv.config();

const dbUrl = process.env.DB_URL || "mongodb://127.0.0.1:27017";
const dbName = process.env.DB_NAME || "homely-food";
const MONGODB_URI = dbUrl.includes("mongodb+srv")
  ? `${dbUrl}/${dbName}?retryWrites=true&w=majority`
  : `${dbUrl}/${dbName}`;

const sampleOffers = [
  {
    offerType: "FLAT",
    title: "Flat ₹10 Off",
    code: "SAVE10",
    description: "Get flat ₹10 off on minimum cart value of ₹70",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
    startDate: new Date(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    isActive: true,
    minCartValue: 70,
    flatDiscountAmount: 10,
    maxDiscountAmount: 10,
  },
  {
    offerType: "FLAT",
    title: "Flat ₹20 Off",
    code: "SAVE20",
    description: "Get flat ₹20 off on minimum cart value of ₹120",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
    startDate: new Date(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isActive: true,
    minCartValue: 120,
    flatDiscountAmount: 20,
    maxDiscountAmount: 20,
  },
  {
    offerType: "FLAT",
    title: "Flat ₹30 Off",
    code: "SAVE30",
    description: "Get flat ₹30 off on minimum cart value of ₹150",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
    startDate: new Date(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isActive: true,
    minCartValue: 150,
    flatDiscountAmount: 30,
    maxDiscountAmount: 30,
  },
];

export async function seedOffers() {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGODB_URI);
    }
    console.log("Seeding offers data...");

    for (const offerData of sampleOffers) {
      await Offer.findOneAndUpdate(
        { code: offerData.code },
        offerData,
        { upsert: true, new: true }
      );
    }
    console.log("Offers seeded successfully!");
  } catch (error) {
    console.error("Error seeding offers:", error);
  }
}

seedOffers().then(() => {
  mongoose.disconnect();
  process.exit(0);
}).catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});

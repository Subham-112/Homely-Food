import dotenv from "dotenv";
import path from "path";

dotenv.config({
  quiet: true,
  path: path.resolve(__dirname, "../../.env"),
});

const toBool = (value: string | undefined): boolean => value !== "false";

export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  mongodbUri: process.env.DB_URL || process.env.MONGODB_URI || "mongodb://localhost:27017/homely_food",
  
  db: {
    url: process.env.DB_URL || process.env.MONGODB_URI || "mongodb://localhost:27017/homely_food",
    name: process.env.DB_NAME || "homely-food",
  },

  jwt: {
    secret: process.env.JWT_SECRET || "supersecret_homely_food_jwt_secret_key_12345",
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || process.env.JWT_REFRESH_SECRET || "supersecret_refresh_homely_food_jwt_secret_key_12345",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    accessMaxAge: Number(process.env.ACCESS_MAX_AGE) || 7,
    refreshMaxAge: Number(process.env.REFRESH_MAX_AGE) || 30,
  },

  cors: {
    enabled: toBool(process.env.CORS_ENABLED),
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || [],
  },

  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },
};

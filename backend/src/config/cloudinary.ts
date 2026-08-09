import { v2 as cloudinary } from "cloudinary";
import { config } from "./config";

const cloudName = config.cloudinary.cloudName;
const apiKey = config.cloudinary.apiKey;
const apiSecret = config.cloudinary.apiSecret;

if (!cloudName || cloudName === "") {
  console.warn("⚠️ CLOUDINARY_CLOUD_NAME is missing.");
}

if (!apiKey || apiKey === "") {
  console.warn("⚠️ CLOUDINARY_API_KEY is missing.");
}

if (!apiSecret || apiSecret === "") {
  console.warn("⚠️ CLOUDINARY_API_SECRET is missing.");
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true,
});

export default cloudinary;

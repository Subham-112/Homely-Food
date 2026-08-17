import Razorpay from "razorpay";
import { config } from "../../config/config";
import { logger } from "../../config/logger";

let instance: Razorpay | null = null;

export const getRazorpayInstance = (): Razorpay => {
  if (!instance) {
    if (!config.razorpay.keyId || !config.razorpay.keySecret) {
      logger.warn("⚠️ RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET missing in environment config");
    }
    instance = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
  }
  return instance;
};

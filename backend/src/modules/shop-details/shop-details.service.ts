import ShopDetails, { IShopDetails } from "../../models/shopDetails.model";
import ApiError from "../../utils/ApiError";

export class ShopDetailsService {
  // Get active shop details (or create default if empty)
  static async getShopDetails(): Promise<IShopDetails> {
    let details = await ShopDetails.findOne();
    if (!details) {
      details = await ShopDetails.create({
        shopName: "Homely Food",
        isStoreOpen: true,
        discountMode: "hybrid",
        globalDiscountPercent: 0,
      });
    }
    return details;
  }

  // Update shop details
  static async updateShopDetails(payload: Partial<IShopDetails>): Promise<IShopDetails> {
    let details = await ShopDetails.findOne();
    if (!details) {
      details = new ShopDetails(payload);
    } else {
      Object.assign(details, payload);
    }
    await details.save();
    return details;
  }

  // Toggle store open/closed status
  static async toggleStoreStatus(): Promise<IShopDetails> {
    const details = await this.getShopDetails();
    details.isStoreOpen = !details.isStoreOpen;
    await details.save();
    return details;
  }

  // Toggle delivery orders enabled/disabled
  static async toggleDeliveryStatus(): Promise<IShopDetails> {
    const details = await this.getShopDetails();
    details.isDeliveryEnabled = details.isDeliveryEnabled !== undefined ? !details.isDeliveryEnabled : false;
    await details.save();
    return details;
  }

  // Check if a pincode is deliverable / serviceable
  static async checkPincodeServiceable(pincode: string): Promise<{ pincode: string; isServiceable: boolean }> {
    const details = await this.getShopDetails();
    const cleanPincode = pincode.trim();
    const isServiceable = Array.isArray(details.serviceablePincodes)
      ? details.serviceablePincodes.includes(cleanPincode)
      : false;
    return {
      pincode: cleanPincode,
      isServiceable,
    };
  }
}

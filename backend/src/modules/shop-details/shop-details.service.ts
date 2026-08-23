import ShopDetails, { IShopDetails } from "../../models/shopDetails.model";
import ApiError from "../../utils/ApiError";

export class ShopDetailsService {
  // Get active shop details (or create default if empty)
  static async getShopDetails(): Promise<IShopDetails> {
    let details = await ShopDetails.findOne();
    if (!details) {
      details = await ShopDetails.create({
        shopName: "Homely Food",
        ownerName: "Homely Food Admin",
        emails: ["support@homelyfood.com"],
        phones: ["9876543210"],
        address: {
          street: "123 Food Court",
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

  // Check if a pincode is deliverable / serviceable
  static async checkPincodeServiceable(pincode: string): Promise<{ pincode: string; isServiceable: boolean }> {
    const details = await this.getShopDetails();
    const cleanPincode = pincode.trim();
    const isServiceable = details.serviceablePincodes.includes(cleanPincode);
    return {
      pincode: cleanPincode,
      isServiceable,
    };
  }
}

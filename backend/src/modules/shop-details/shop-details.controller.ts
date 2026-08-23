import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ShopDetailsService } from "./shop-details.service";

const addressSchema = z.object({
  street: z.string().optional(),
  area: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(1, "Pincode is required"),
  landmark: z.string().optional(),
});

export const updateShopDetailsSchema = z.object({
  shopName: z.string().min(1, "Shop name is required").optional(),
  ownerName: z.string().min(1, "Owner name is required").optional(),
  emails: z.array(z.string().email("Invalid email address")).min(1, "At least one email is required").optional(),
  phones: z.array(z.string().min(1, "Invalid phone number")).min(1, "At least one phone is required").optional(),
  address: addressSchema.optional(),
  serviceablePincodes: z.array(z.string().min(1, "Invalid pincode")).optional(),
  logo: z.string().optional(),
  bannerImage: z.string().optional(),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
  isStoreOpen: z.boolean().optional(),
  minimumOrderAmount: z.number().min(0).optional(),
  deliveryCharge: z.number().min(0).optional(),
  freeDeliveryThreshold: z.number().min(0).optional(),
  fssaiLicenseNumber: z.string().optional(),
  gstNumber: z.string().optional(),
});

export class ShopDetailsController {
  // GET /api/shop-details
  static async getDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const details = await ShopDetailsService.getShopDetails();
      res.status(200).json({
        statusCode: 200,
        success: true,
        message: "Shop details fetched successfully",
        data: details,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/shop-details
  static async updateDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = updateShopDetailsSchema.parse(req.body);
      const updated = await ShopDetailsService.updateShopDetails(validatedData as any);
      res.status(200).json({
        statusCode: 200,
        success: true,
        message: "Shop details updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/shop-details/toggle-status
  static async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await ShopDetailsService.toggleStoreStatus();
      res.status(200).json({
        statusCode: 200,
        success: true,
        message: `Store status toggled to ${updated.isStoreOpen ? "OPEN" : "CLOSED"}`,
        data: {
          isStoreOpen: updated.isStoreOpen,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/shop-details/check-pincode/:pincode
  static async checkPincode(req: Request, res: Response, next: NextFunction) {
    try {
      const pincode = String(req.params.pincode);
      const result = await ShopDetailsService.checkPincodeServiceable(pincode);
      res.status(200).json({
        statusCode: 200,
        success: true,
        message: result.isServiceable
          ? `Pincode ${result.pincode} is deliverable.`
          : `Pincode ${result.pincode} is not deliverable.`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

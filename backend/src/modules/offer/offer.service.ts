import Offer, { IOffer } from "../../models/offer.model";
import ApiError from "../../utils/ApiError";
import { OfferType, OfferStatus } from "../../common/enum";

export interface ICreateOfferInput {
  offerType: OfferType;
  title: string;
  code?: string;
  description?: string;
  image: string;
  startDate: string | Date;
  endDate: string | Date;
  isActive?: boolean;

  // BOGO
  buyItem?: string;
  buyQuantity?: number;
  freeItem?: string;
  freeQuantity?: number;

  // Percentage & Flat
  minCartValue?: number;
  discountPercentage?: number;
  flatDiscountAmount?: number;
  maxDiscountAmount?: number;
}

export class OfferService {
  static async generateUniqueCouponCode(offerType: string): Promise<string> {
    const prefixMap: Record<string, string> = {
      [OfferType.BOGO]: "BOGO",
      [OfferType.PERCENTAGE]: "SAVE",
      [OfferType.FLAT]: "FLAT",
    };
    const prefix = prefixMap[offerType] || "OFFER";
    let isUnique = false;
    let code = "";

    while (!isUnique) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      code = `${prefix}${randomNum}`;
      const existing = await Offer.findOne({ code });
      if (!existing) {
        isUnique = true;
      }
    }
    return code;
  }

  static async create(payload: ICreateOfferInput) {
    if (!payload.title || !payload.title.trim()) {
      throw new ApiError(400, "Offer title is required.");
    }

    let cleanCode = payload.code ? payload.code.trim().toUpperCase() : "";
    if (!cleanCode) {
      cleanCode = await OfferService.generateUniqueCouponCode(payload.offerType);
    } else {
      const existingCode = await Offer.findOne({ code: cleanCode });
      if (existingCode) {
        throw new ApiError(400, `Coupon code "${cleanCode}" already exists.`);
      }
    }

    const startDate = new Date(payload.startDate);
    const endDate = new Date(payload.endDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new ApiError(400, "Invalid start or end date provided.");
    }
    if (endDate <= startDate) {
      throw new ApiError(400, "End date must be after start date.");
    }

    // Type-specific validations
    if (payload.offerType === "BOGO") {
      if (!payload.buyItem) throw new ApiError(400, "Buy item is required for BOGO offers.");
      if (!payload.buyQuantity || payload.buyQuantity < 1) throw new ApiError(400, "Buy quantity must be at least 1.");
      if (!payload.freeItem) throw new ApiError(400, "Free item is required for BOGO offers.");
      if (!payload.freeQuantity || payload.freeQuantity < 1) throw new ApiError(400, "Free quantity must be at least 1.");
    } else if (payload.offerType === "PERCENTAGE") {
      if (payload.minCartValue === undefined || payload.minCartValue < 0) {
        throw new ApiError(400, "Minimum cart value is required for Percentage Off offers.");
      }
      if (!payload.discountPercentage || payload.discountPercentage <= 0 || payload.discountPercentage > 100) {
        throw new ApiError(400, "Valid discount percentage (1-100%) is required.");
      }
      if (payload.maxDiscountAmount === undefined || payload.maxDiscountAmount < 0) {
        throw new ApiError(400, "Maximum discount amount cap in Rupees is required.");
      }
    } else if (payload.offerType === "FLAT") {
      if (payload.minCartValue === undefined || payload.minCartValue < 0) {
        throw new ApiError(400, "Minimum cart value is required for Flat Off offers.");
      }
      if (!payload.flatDiscountAmount || payload.flatDiscountAmount <= 0) {
        throw new ApiError(400, "Flat discount amount in Rupees is required.");
      }
      if (payload.maxDiscountAmount === undefined || payload.maxDiscountAmount < 0) {
        throw new ApiError(400, "Maximum discount amount cap in Rupees is required.");
      }
    } else {
      throw new ApiError(400, "Invalid offer type provided.");
    }

    const offer = await Offer.create({
      offerType: payload.offerType,
      title: payload.title.trim(),
      code: cleanCode,
      description: payload.description?.trim() || "",
      image: payload.image.trim(),
      startDate,
      endDate,
      isActive: payload.isActive !== undefined ? payload.isActive : true,
      buyItem: payload.buyItem || undefined,
      buyQuantity: payload.buyQuantity || undefined,
      freeItem: payload.freeItem || undefined,
      freeQuantity: payload.freeQuantity || undefined,
      minCartValue: payload.minCartValue !== undefined ? payload.minCartValue : undefined,
      discountPercentage: payload.discountPercentage !== undefined ? payload.discountPercentage : undefined,
      flatDiscountAmount: payload.flatDiscountAmount !== undefined ? payload.flatDiscountAmount : undefined,
      maxDiscountAmount: payload.maxDiscountAmount !== undefined ? payload.maxDiscountAmount : undefined,
    });

    return await Offer.findById(offer._id).populate("buyItem freeItem", "name price image");
  }

  static async getAll(query: { search?: string; type?: "active" | "others" | "all" }) {
    const filter: any = {};

    if (query.search && query.search.trim()) {
      const regex = new RegExp(query.search.trim(), "i");
      filter.$or = [{ title: regex }, { code: regex }, { description: regex }];
    }

    const now = new Date();
    if (query.type === "active") {
      filter.startDate = { $lte: now };
      filter.endDate = { $gte: now };
      filter.isActive = true;
    } else if (query.type === "others") {
      filter.$or = [{ endDate: { $lt: now } }, { isActive: false }, { startDate: { $gt: now } }];
    }

    const offers = await Offer.find(filter)
      .sort({ createdAt: -1 })
      .populate("buyItem freeItem", "name price image");

    // Map calculated status property
    const result = offers.map((offer) => {
      const doc = offer.toObject() as any;
      const end = new Date(doc.endDate);
      const start = new Date(doc.startDate);

      if (now > end) {
        doc.status = OfferStatus.EXPIRED;
      } else if (!doc.isActive) {
        doc.status = OfferStatus.INACTIVE;
      } else if (now < start) {
        doc.status = OfferStatus.UPCOMING;
      } else {
        doc.status = OfferStatus.ACTIVE;
      }
      return doc;
    });

    return result;
  }

  static async getById(id: string) {
    const offer = await Offer.findById(id).populate("buyItem freeItem", "name price image");
    if (!offer) {
      throw new ApiError(404, "Offer not found.");
    }
    return offer;
  }

  static async update(id: string, payload: Partial<ICreateOfferInput>) {
    const offer = await Offer.findById(id);
    if (!offer) {
      throw new ApiError(404, "Offer not found.");
    }

    if (payload.code && payload.code.trim().toUpperCase() !== offer.code) {
      const cleanCode = payload.code.trim().toUpperCase();
      const existing = await Offer.findOne({ code: cleanCode });
      if (existing) {
        throw new ApiError(400, `Coupon code "${cleanCode}" already exists.`);
      }
      offer.code = cleanCode;
    }

    if (payload.title !== undefined) offer.title = payload.title.trim();
    if (payload.description !== undefined) offer.description = payload.description.trim();
    if (payload.image !== undefined) offer.image = payload.image.trim();
    if (payload.startDate !== undefined) offer.startDate = new Date(payload.startDate);
    if (payload.endDate !== undefined) offer.endDate = new Date(payload.endDate);
    if (payload.isActive !== undefined) offer.isActive = payload.isActive;
    if (payload.offerType !== undefined) offer.offerType = payload.offerType;

    // Type fields
    if (payload.buyItem !== undefined) offer.buyItem = payload.buyItem as any;
    if (payload.buyQuantity !== undefined) offer.buyQuantity = payload.buyQuantity;
    if (payload.freeItem !== undefined) offer.freeItem = payload.freeItem as any;
    if (payload.freeQuantity !== undefined) offer.freeQuantity = payload.freeQuantity;

    if (payload.minCartValue !== undefined) offer.minCartValue = payload.minCartValue;
    if (payload.discountPercentage !== undefined) offer.discountPercentage = payload.discountPercentage;
    if (payload.flatDiscountAmount !== undefined) offer.flatDiscountAmount = payload.flatDiscountAmount;
    if (payload.maxDiscountAmount !== undefined) offer.maxDiscountAmount = payload.maxDiscountAmount;

    await offer.save();
    return await Offer.findById(offer._id).populate("buyItem freeItem", "name price image");
  }

  static async toggleActive(id: string) {
    const offer = await Offer.findById(id);
    if (!offer) {
      throw new ApiError(404, "Offer not found.");
    }
    offer.isActive = !offer.isActive;
    await offer.save();
    return await Offer.findById(offer._id).populate("buyItem freeItem", "name price image");
  }

  static async repost(id: string) {
    const offer = await Offer.findById(id);
    if (!offer) {
      throw new ApiError(404, "Offer not found.");
    }

    const newStart = new Date();
    const newEnd = new Date();
    newEnd.setDate(newStart.getDate() + 30);

    offer.startDate = newStart;
    offer.endDate = newEnd;
    offer.isActive = true;

    await offer.save();
    return await Offer.findById(offer._id).populate("buyItem freeItem", "name price image");
  }

  static async delete(id: string) {
    const offer = await Offer.findByIdAndDelete(id);
    if (!offer) {
      throw new ApiError(404, "Offer not found.");
    }
    return { id };
  }
}

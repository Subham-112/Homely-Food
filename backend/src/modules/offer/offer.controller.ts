import { Request, Response, NextFunction } from "express";
import { OfferService } from "./offer.service";
import ApiResponse from "../../utils/ApiResponse";
import ApiError from "../../utils/ApiError";
import { OfferType } from "../../common/enum";

export class OfferController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        offerType,
        title,
        image,
        startDate,
        endDate,
        buyItem,
        buyQuantity,
        freeItem,
        freeQuantity,
        minCartValue,
        discountPercentage,
        flatDiscountAmount,
        maxDiscountAmount,
      } = req.body;

      if (!offerType || !Object.values(OfferType).includes(offerType as any)) {
        throw new ApiError(400, "Valid offer type (BOGO, PERCENTAGE, FLAT) is required.");
      }
      if (!title || !title.trim()) {
        throw new ApiError(400, "Offer title is required.");
      }
      if (!image || !image.trim()) {
        throw new ApiError(400, "Offer image is mandatory.");
      }
      if (!startDate) {
        throw new ApiError(400, "Start date is mandatory.");
      }
      if (!endDate) {
        throw new ApiError(400, "End date is mandatory.");
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new ApiError(400, "Invalid start or end date provided.");
      }
      if (end <= start) {
        throw new ApiError(400, "End date must be after start date.");
      }

      if (offerType === "BOGO") {
        if (!buyItem) throw new ApiError(400, "Buy item is required for BOGO offers.");
        if (buyQuantity === undefined || buyQuantity < 1) throw new ApiError(400, "Buy quantity must be at least 1.");
        if (!freeItem) throw new ApiError(400, "Free item is required for BOGO offers.");
        if (freeQuantity === undefined || freeQuantity < 1) throw new ApiError(400, "Free quantity must be at least 1.");
      } else if (offerType === "PERCENTAGE") {
        if (minCartValue === undefined || minCartValue === "" || Number(minCartValue) < 0) {
          throw new ApiError(400, "Minimum cart value is required for Percentage Off offers.");
        }
        if (discountPercentage === undefined || discountPercentage === "" || Number(discountPercentage) <= 0 || Number(discountPercentage) > 100) {
          throw new ApiError(400, "Valid discount percentage (1-100%) is required.");
        }
        if (maxDiscountAmount === undefined || maxDiscountAmount === "" || Number(maxDiscountAmount) < 0) {
          throw new ApiError(400, "Maximum discount cap amount in Rupees is required.");
        }
      } else if (offerType === "FLAT") {
        if (minCartValue === undefined || minCartValue === "" || Number(minCartValue) < 0) {
          throw new ApiError(400, "Minimum cart value is required for Flat Off offers.");
        }
        if (flatDiscountAmount === undefined || flatDiscountAmount === "" || Number(flatDiscountAmount) <= 0) {
          throw new ApiError(400, "Flat discount amount in Rupees is required.");
        }
        if (maxDiscountAmount === undefined || maxDiscountAmount === "" || Number(maxDiscountAmount) < 0) {
          throw new ApiError(400, "Maximum discount cap amount in Rupees is required.");
        }
      }

      const offer = await OfferService.create(req.body);
      res.status(201).json(new ApiResponse(201, offer, "Offer created successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, type, status } = req.query;
      const offers = await OfferService.getAll({
        search: search as string,
        type: ((type || status) as any),
      });
      res.status(200).json(new ApiResponse(200, offers, "Offers fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new ApiError(400, "Offer ID is required.");
      }
      const offer = await OfferService.getById(id);
      res.status(200).json(new ApiResponse(200, offer, "Offer fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new ApiError(400, "Offer ID is required.");
      }
      const offer = await OfferService.update(id, req.body);
      res.status(200).json(new ApiResponse(200, offer, "Offer updated successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new ApiError(400, "Offer ID is required.");
      }
      const offer = await OfferService.toggleActive(id);
      res.status(200).json(new ApiResponse(200, offer, "Offer active state updated successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async repost(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new ApiError(400, "Offer ID is required.");
      }
      const offer = await OfferService.repost(id);
      res.status(200).json(new ApiResponse(200, offer, "Offer reposted successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new ApiError(400, "Offer ID is required.");
      }
      const result = await OfferService.delete(id);
      res.status(200).json(new ApiResponse(200, result, "Offer deleted successfully"));
    } catch (error) {
      next(error);
    }
  }
}

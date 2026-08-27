import { Request, Response, NextFunction } from "express";
import { MenuItemService } from "./menu-items.service";
import { z } from "zod";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { MenuItemStatus } from "../../common/enum";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

import { IImage } from "../../common/image.schema";

const mapUploadedFileToIImage = (uploaded: any): IImage => ({
  url: uploaded.url,
  publicId: uploaded.publicId,
  key: uploaded.publicId,
  name: uploaded.publicId?.split("/").pop(),
  size: uploaded.bytes,
  mimetype: uploaded.format ? `image/${uploaded.format}` : undefined,
});

const createMenuItemSchema = z.object({
  name: z.string({ required_error: "Menu item name is required" }).min(1, "Menu item name is required"),
  category: z.string({ required_error: "Category reference is required" }).min(1, "Category reference is required"),
  description: z.string().optional(),
  status: z.nativeEnum(MenuItemStatus, { errorMap: () => ({ message: "Status must be either available or unavailable" }) }).optional(),
  price: z.preprocess((val) => (typeof val === "string" ? parseFloat(val) : val), z.number({ required_error: "Price is required" }).min(0, "Price cannot be negative")),
  preparationTime: z.preprocess((val) => (typeof val === "string" ? parseInt(val, 10) : val), z.number().optional()),
  priority: z.preprocess((val) => (typeof val === "string" ? parseInt(val, 10) : val), z.number().min(0).optional()),
  tags: z.preprocess((val) => {
    if (typeof val === "string") {
      try { return JSON.parse(val); } catch { return val.split(",").map(s => s.trim()).filter(Boolean); }
    }
    return val;
  }, z.array(z.string()).optional()),
  allergens: z.preprocess((val) => {
    if (typeof val === "string") {
      try { return JSON.parse(val); } catch { return val.split(",").map(s => s.trim()).filter(Boolean); }
    }
    return val;
  }, z.array(z.string()).optional()),
  image: z.any().optional(),
  isTodaySpecial: z.preprocess((val) => (typeof val === "string" ? val === "true" : val), z.boolean().optional()),
  variants: z.preprocess(
    (val) => {
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return val;
        }
      }
      return val;
    },
    z.array(
      z.object({
        label: z.string({ required_error: "Variant label is required" }).min(1, "Variant label is required"),
        price: z.preprocess(
          (p) => (typeof p === "string" ? parseFloat(p) : p),
          z.number({ required_error: "Variant price is required" }).min(0, "Variant price cannot be negative")
        ),
      })
    ).optional()
  ),
});

const updateMenuItemSchema = createMenuItemSchema.partial();
const toggleStatusSchema = z.object({
  status: z.nativeEnum(MenuItemStatus, { errorMap: () => ({ message: "Status must be either available or unavailable" }) }).optional(),
});

const reorderMenuItemSchema = z.object({
  orderedItemIds: z.array(z.string(), { required_error: "orderedItemIds is required" }).min(1, "At least one item ID is required"),
});

export class MenuItemController {
  static async getOrderList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const result = await MenuItemService.getOrderList({ search, page, limit });
      res.status(200).json(new ApiResponse(200, result, "Order list items fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createMenuItemSchema.parse(req.body);
      const uploadedFile = (req as any).uploadedFile;
      let imagePayload: any = undefined;

      if (uploadedFile) {
        imagePayload = mapUploadedFileToIImage(uploadedFile);
      } else if (validatedData.image) {
        if (typeof validatedData.image === "string") {
          if (validatedData.image.trim() && validatedData.image !== "[object Object]" && validatedData.image !== "{}") {
            imagePayload = { url: validatedData.image.trim() };
          }
        } else if (typeof validatedData.image === "object" && validatedData.image.url) {
          imagePayload = validatedData.image;
        }
      }

      const menuItem = await MenuItemService.create({
        ...validatedData,
        image: imagePayload,
      });
      res.status(201).json(new ApiResponse(201, menuItem, "Menu item created successfully"));
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ApiError(400, error.errors.map((e) => e.message).join(". "), null, error.errors));
        return;
      }
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, isTodaySpecial, search, name, page, limit } = req.query;
      const result = await MenuItemService.getAll({
        category: typeof category === "string" ? category : undefined,
        status: MenuItemStatus.AVAILABLE,
        isTodaySpecial: isTodaySpecial !== undefined ? isTodaySpecial === "true" : undefined,
        search: typeof search === "string" ? search : typeof name === "string" ? name : undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
      });
      res.status(200).json(new ApiResponse(200, result, "Menu items fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async getAllForAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, status, isTodaySpecial, search, name, page, limit } = req.query;
      const result = await MenuItemService.getAll({
        category: typeof category === "string" ? category : undefined,
        status: typeof status === "string" ? (status as MenuItemStatus) : undefined,
        isTodaySpecial: isTodaySpecial !== undefined ? isTodaySpecial === "true" : undefined,
        search: typeof search === "string" ? search : typeof name === "string" ? name : undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
        requireActiveCategory: false,
      });
      res.status(200).json(new ApiResponse(200, result, "Admin menu items fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const menuItem = await MenuItemService.getById(id);
      res.status(200).json(new ApiResponse(200, menuItem, "Menu item fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validatedData = updateMenuItemSchema.parse(req.body);
      const uploadedFile = (req as any).uploadedFile;
      let imagePayload: any = undefined;

      if (uploadedFile) {
        imagePayload = mapUploadedFileToIImage(uploadedFile);
      } else if (validatedData.image) {
        if (typeof validatedData.image === "string") {
          if (validatedData.image.trim() && validatedData.image !== "[object Object]" && validatedData.image !== "{}") {
            imagePayload = { url: validatedData.image.trim() };
          }
        } else if (typeof validatedData.image === "object" && validatedData.image.url) {
          imagePayload = validatedData.image;
        }
      }

      const menuItem = await MenuItemService.update(id, {
        ...validatedData,
        ...(imagePayload !== undefined ? { image: imagePayload } : {}),
      });
      res.status(200).json(new ApiResponse(200, menuItem, "Menu item updated successfully"));
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ApiError(400, error.errors.map((e) => e.message).join(". "), null, error.errors));
        return;
      }
      next(error);
    }
  }

  static async toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validatedData = toggleStatusSchema.parse(req.body);
      const menuItem = await MenuItemService.toggleStatus(id, validatedData.status);
      res.status(200).json(new ApiResponse(200, menuItem, `Menu item status updated to ${menuItem.status}`));
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ApiError(400, error.errors.map((e) => e.message).join(". "), null, error.errors));
        return;
      }
      next(error);
    }
  }

  static async reorderPriority(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = reorderMenuItemSchema.parse(req.body);
      await MenuItemService.reorderPriority(validatedData.orderedItemIds);
      res.status(200).json(new ApiResponse(200, null, "Menu items priority reordered successfully"));
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ApiError(400, error.errors.map((e) => e.message).join(". "), null, error.errors));
        return;
      }
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const deletedBy = req.user?._id;
      await MenuItemService.delete(id, deletedBy);
      res.status(200).json(new ApiResponse(200, null, "Menu item soft deleted successfully"));
    } catch (error) {
      next(error);
    }
  }
}

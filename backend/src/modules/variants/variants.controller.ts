import { Request, Response, NextFunction } from "express";
import { VariantService } from "./variants.service";
import { z } from "zod";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { VariantStatus } from "../../common/enum";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

const createVariantSchema = z.object({
  menuItem: z.string({ required_error: "MenuItem reference is required" }).min(1, "MenuItem reference is required"),
  label: z.string({ required_error: "Variant label is required" }).min(1, "Variant label is required"),
  price: z.number({ required_error: "Variant price is required" }).min(0, "Price cannot be negative"),
  status: z.nativeEnum(VariantStatus, { errorMap: () => ({ message: "Status must be either active or inactive" }) }).optional(),
});

const updateVariantSchema = createVariantSchema.partial();
const toggleStatusSchema = z.object({
  status: z.nativeEnum(VariantStatus, { errorMap: () => ({ message: "Status must be either active or inactive" }) }).optional(),
});

export class VariantController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createVariantSchema.parse(req.body);
      const variant = await VariantService.create(validatedData);
      res.status(201).json(new ApiResponse(201, variant, "Variant created successfully"));
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ApiError(400, error.errors.map((e) => e.message).join(". "), null, error.errors));
        return;
      }
      next(error);
    }
  }

  static async getByMenuItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const menuItemId = Array.isArray(req.params.menuItemId) ? req.params.menuItemId[0] : req.params.menuItemId;
      const variants = await VariantService.getByMenuItem(menuItemId);
      res.status(200).json(new ApiResponse(200, variants, "MenuItem variants fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const variant = await VariantService.getById(id);
      res.status(200).json(new ApiResponse(200, variant, "Variant fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validatedData = updateVariantSchema.parse(req.body);
      const variant = await VariantService.update(id, validatedData);
      res.status(200).json(new ApiResponse(200, variant, "Variant updated successfully"));
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
      const variant = await VariantService.toggleStatus(id, validatedData.status);
      res.status(200).json(new ApiResponse(200, variant, `Variant status updated to ${variant.status}`));
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
      await VariantService.delete(id, deletedBy);
      res.status(200).json(new ApiResponse(200, null, "Variant soft deleted successfully"));
    } catch (error) {
      next(error);
    }
  }
}

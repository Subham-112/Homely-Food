import { Request, Response, NextFunction } from "express";
import { CategoryService } from "./category.service";
import { z } from "zod";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { CategoryStatus } from "../../common/enum";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

const createCategorySchema = z.object({
  name: z.string({ required_error: "Category name is required" }).min(1, "Category name is required"),
  description: z.string().optional(),
  status: z.nativeEnum(CategoryStatus, { errorMap: () => ({ message: "Status must be either active or inactive" }) }).optional(),
});

const updateCategorySchema = createCategorySchema.partial();

export class CategoryController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createCategorySchema.parse(req.body);
      const category = await CategoryService.create(validatedData);
      res.status(201).json(new ApiResponse(201, category, "Category created successfully"));
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ApiError(400, error.errors.map((e) => e.message).join(". "), null, error.errors));
        return;
      }
      next(error);
    }
  }

  // Admin access: Get all active and inactive non-deleted categories
  static async getAllForAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as CategoryStatus | undefined;
      const search = req.query.search as string | undefined;
      const categories = await CategoryService.getAllForAdmin({ status, search });
      res.status(200).json(new ApiResponse(200, categories, "Admin categories fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  // User access: Get active non-deleted categories only
  static async getActiveCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await CategoryService.getActiveCategories();
      res.status(200).json(new ApiResponse(200, categories, "Active categories fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  // Return only id and name of active categories
  static async getActiveCategoryList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await CategoryService.getActiveCategoryList();
      res.status(200).json(new ApiResponse(200, categories, "Active category list fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const category = await CategoryService.getById(id);
      res.status(200).json(new ApiResponse(200, category, "Category fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validatedData = updateCategorySchema.parse(req.body);
      const category = await CategoryService.update(id, validatedData);
      res.status(200).json(new ApiResponse(200, category, "Category updated successfully"));
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
      const category = await CategoryService.toggleStatus(id);
      res.status(200).json(new ApiResponse(200, category, `Category status updated to ${category.status}`));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const deletedBy = req.user?._id;
      await CategoryService.delete(id, deletedBy);
      res.status(200).json(new ApiResponse(200, null, "Category soft deleted successfully"));
    } catch (error) {
      next(error);
    }
  }
}

import { Response, NextFunction } from "express";
import { CartService } from "./cart.service";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";
import ApiResponse from "../../utils/ApiResponse";
import ApiError from "../../utils/ApiError";
import { z } from "zod";

const syncCartSchema = z.object({
  items: z.array(
    z.object({
      menuItem: z.string().min(1, "Menu item ID is required"),
      quantity: z.number().min(1, "Quantity must be at least 1"),
      variant: z.string().optional(),
    })
  ),
});

export class CartController {
  static async getCart(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        throw new ApiError(401, "Unauthorized: User context missing.");
      }
      const cart = await CartService.getCart(userId);
      res.status(200).json(new ApiResponse(200, cart, "Cart fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async syncCart(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        throw new ApiError(401, "Unauthorized: User context missing.");
      }
      const validatedData = syncCartSchema.parse(req.body);
      const cart = await CartService.syncCart(userId, validatedData.items);
      res.status(200).json(new ApiResponse(200, cart, "Cart synchronized successfully"));
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ApiError(400, error.errors.map((e) => e.message).join(". "), null, error.errors));
        return;
      }
      next(error);
    }
  }

  static async clearCart(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        throw new ApiError(401, "Unauthorized: User context missing.");
      }
      await CartService.clearCart(userId);
      res.status(200).json(new ApiResponse(200, null, "Cart cleared successfully"));
    } catch (error) {
      next(error);
    }
  }
}

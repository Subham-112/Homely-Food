import { Response, NextFunction } from "express";
import { CartService } from "./cart.service";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";
import ApiResponse from "../../utils/ApiResponse";
import ApiError from "../../utils/ApiError";
import { z } from "zod";
import { OrderType, PaymentMethod } from "../../common/enum";

const syncCartSchema = z.object({
  items: z.array(
    z.object({
      menuItem: z.string().min(1, "Menu item ID is required"),
      quantity: z.number().min(1, "Quantity must be at least 1"),
      variant: z.string().optional(),
    })
  ),
});

const applyOfferSchema = z.object({
  offerCode: z.string().min(1, "Offer/Coupon code is required"),
});

const checkoutSchema = z.object({
  cartId: z.string().optional(),
  orderType: z.nativeEnum(OrderType).optional(),
  deliveryAddress: z.string().optional(),
  pickupTiming: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  paymentPreference: z.enum(["CASH", "ONLINE"]).optional().default("CASH"),
  guest: z
    .object({
      name: z.string(),
      phone: z.string(),
      email: z.string().optional(),
    })
    .optional(),
  checkoutScope: z.enum(["all", "cart_only", "reorder_only"]).optional().default("all"),
  keepRemaining: z.boolean().optional().default(false),
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

  static async applyOffer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        throw new ApiError(401, "Unauthorized: User context missing.");
      }
      const validatedData = applyOfferSchema.parse(req.body);
      const cart = await CartService.applyOffer(userId, validatedData.offerCode);
      res.status(200).json(new ApiResponse(200, cart, "Offer applied successfully"));
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ApiError(400, error.errors.map((e) => e.message).join(". "), null, error.errors));
        return;
      }
      next(error);
    }
  }

  static async removeOffer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        throw new ApiError(401, "Unauthorized: User context missing.");
      }
      const cart = await CartService.removeOffer(userId);
      res.status(200).json(new ApiResponse(200, cart, "Offer removed successfully"));
    } catch (error) {
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

  static async checkout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        throw new ApiError(401, "Unauthorized: User context missing.");
      }
      const validatedData = checkoutSchema.parse(req.body);
      const order = await CartService.checkout(userId, validatedData);
      res.status(201).json(new ApiResponse(201, order, "Order placed successfully from cart"));
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ApiError(400, error.errors.map((e) => e.message).join(". "), null, error.errors));
        return;
      }
      next(error);
    }
  }

  static async getCoinDeduction(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        throw new ApiError(401, "Unauthorized: User context missing.");
      }
      const cartId = (req.params.cartId || req.query.cartId) as string | undefined;
      const deductionData = await CartService.calculateCoinDeduction(userId, cartId);
      res.status(200).json(new ApiResponse(200, deductionData, "Coin deduction calculated successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async applyCoins(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        throw new ApiError(401, "Unauthorized: User context missing.");
      }
      const cartId = req.body.cartId as string | undefined;
      const cart = await CartService.applyCoins(userId, cartId);
      res.status(200).json(new ApiResponse(200, cart, "Homely Coins applied successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async removeCoins(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        throw new ApiError(401, "Unauthorized: User context missing.");
      }
      const cartId = req.body.cartId as string | undefined;
      const cart = await CartService.removeCoins(userId, cartId);
      res.status(200).json(new ApiResponse(200, cart, "Homely Coins removed successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async reorder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        throw new ApiError(401, "Unauthorized: User context missing.");
      }
      const orderId = (req.body.orderId || req.params.orderId) as string;
      if (!orderId) {
        throw new ApiError(400, "Order ID is required to reorder.");
      }
      const cart = await CartService.reorderCart(userId, orderId);
      res.status(200).json(new ApiResponse(200, cart, "Order items added to cart successfully"));
    } catch (error) {
      next(error);
    }
  }
}

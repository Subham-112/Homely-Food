import { Request, Response, NextFunction } from "express";
import { OrderService } from "./order.service";
import { OrderStatus, OrderType, PaymentMethod, PaymentStatus } from "../../common/enum";
import { z } from "zod";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { getDateRangeByPeriod } from "../../utils/dateHelper";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

const createOrderSchema = z.object({
  userId: z.string().optional(),
  guest: z.object({
    name: z.string().min(1, "Guest name is required"),
    phone: z.string().min(1, "Guest phone number is required"),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
  }).optional(),
  items: z
    .array(
      z.object({
        menuItem: z.string({ required_error: "Menu item ID is required" }).min(1, "Menu item ID is required"),
        name: z.string().optional(),
        price: z.number().optional(),
        quantity: z.number({ required_error: "Quantity is required" }).min(1, "Quantity must be at least 1"),
        variant: z
          .object({
            variantId: z.string().optional(),
            label: z.string().optional(),
            price: z.number().optional(),
          })
          .optional(),
      })
    )
    .min(1, "Order must contain at least one item"),
  payment: z
    .object({
      method: z.nativeEnum(PaymentMethod).optional(),
      status: z.nativeEnum(PaymentStatus).optional(),
      transactionId: z.string().optional(),
    })
    .optional(),
  notes: z.string().optional(),
  discount: z.number().optional(),
  orderType: z.enum([OrderType.DINE_IN, OrderType.DELIVERY, OrderType.PICKUP]).optional().default(OrderType.DINE_IN),
  deliveryAddress: z.string().optional(),
  pickupTiming: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.userId && (!data.guest || !data.guest.name || !data.guest.phone)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Guest name and phone are required when no user ID is provided",
      path: ["guest"],
    });
  }

  if (data.orderType === "delivery" && (!data.deliveryAddress || !data.deliveryAddress.trim())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Delivery address is required for delivery orders",
      path: ["deliveryAddress"],
    });
  }

  if (data.orderType === "pickup" && (!data.pickupTiming || !data.pickupTiming.trim())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Pickup date and time are required for pickup orders",
      path: ["pickupTiming"],
    });
  }
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus, { errorMap: () => ({ message: "Invalid order status" }) }),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  isPaid: z.boolean().optional(),
});

export class OrderController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createOrderSchema.parse(req.body);
      const order = await OrderService.create(validatedData);
      res.status(201).json(new ApiResponse(201, order, "Order created successfully"));
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
      const status = req.query.status as OrderStatus | undefined;
      const orderType = req.query.orderType as string | undefined;
      const search = req.query.search as string | undefined;
      const userId = req.query.userId as string | undefined;
      const period = req.query.period as string | undefined;
      const startDateParam = req.query.startDate as string | undefined;
      const endDateParam = req.query.endDate as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const dateRange = getDateRangeByPeriod(period, startDateParam, endDateParam);

      const result = await OrderService.getAll({
        status,
        orderType,
        search,
        page,
        limit,
        userId,
        dateRange,
      });
      res.status(200).json(new ApiResponse(200, result, "Orders fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async getMyOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user || !authReq.user._id) {
        throw new ApiError(401, "Unauthorized. User ID missing.");
      }
      const status = req.query.status as string | undefined;
      const orders = await OrderService.getMyOrders(authReq.user._id, status);
      res.status(200).json(new ApiResponse(200, orders, "User orders fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const order = await OrderService.getById(id);
      res.status(200).json(new ApiResponse(200, order, "Order fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validatedData = updateStatusSchema.parse(req.body);
      const order = await OrderService.updateStatus(
        id,
        validatedData.status,
        validatedData.paymentMethod,
        validatedData.isPaid
      );
      res.status(200).json(new ApiResponse(200, order, "Order status updated successfully"));
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ApiError(400, error.errors.map((e) => e.message).join(". "), null, error.errors));
        return;
      }
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const period = req.query.period as string | undefined;
      const startDateParam = req.query.startDate as string | undefined;
      const endDateParam = req.query.endDate as string | undefined;

      const dateRange = getDateRangeByPeriod(period, startDateParam, endDateParam);
      const stats = await OrderService.getStats(dateRange);
      res.status(200).json(new ApiResponse(200, stats, "Stats fetched successfully"));
    } catch (error) {
      next(error);
    }
  }
}

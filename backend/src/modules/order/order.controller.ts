import { Request, Response, NextFunction } from "express";
import { OrderService } from "./order.service";
import { OrderStatus, PaymentMethod, PaymentStatus } from "../../common/enum";
import { z } from "zod";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";

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
}).superRefine((data, ctx) => {
  if (!data.userId && (!data.guest || !data.guest.name || !data.guest.phone)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Guest name and phone are required when no user ID is provided",
      path: ["guest"],
    });
  }
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus, { errorMap: () => ({ message: "Invalid order status" }) }),
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
      const search = req.query.search as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const result = await OrderService.getAll({ status, search, page, limit });
      res.status(200).json(new ApiResponse(200, result, "Orders fetched successfully"));
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
      const order = await OrderService.updateStatus(id, validatedData.status);
      res.status(200).json(new ApiResponse(200, order, "Order status updated successfully"));
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ApiError(400, error.errors.map((e) => e.message).join(". "), null, error.errors));
        return;
      }
      next(error);
    }
  }
}

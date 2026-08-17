import { Request, Response, NextFunction } from "express";
import { PaymentService } from "./payment.service";
import PaymentAnalyticsService from "../../services/payment-analytics/paymentAnalytics.service";
import ApiResponse from "../../utils/ApiResponse";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";
import { verifyPaymentSchema, refundPaymentSchema } from "./payment.validation";

export class PaymentController {
  public static async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = verifyPaymentSchema.parse(req.body);
      const result = await PaymentService.verifyPayment(validated);
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Payment verified and order created successfully."));
    } catch (error) {
      next(error);
    }
  }

  public static async getPaymentByOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const idStr = Array.isArray(orderId) ? orderId[0] : orderId;
      const payment = await PaymentService.getPaymentByOrder(idStr);
      return res.status(200).json(new ApiResponse(200, payment, "Payment record fetched successfully."));
    } catch (error) {
      next(error);
    }
  }

  public static async getMyPayments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const payments = await PaymentService.getMyPayments(userId);
      return res.status(200).json(new ApiResponse(200, payments, "My payments fetched successfully."));
    } catch (error) {
      next(error);
    }
  }

  public static async getAdminPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, method, paymentMode, page, limit } = req.query;
      const data = await PaymentService.getAdminPayments({
        status: status as any,
        method: method as any,
        paymentMode: paymentMode as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return res.status(200).json(new ApiResponse(200, data, "Admin payments fetched successfully."));
    } catch (error) {
      next(error);
    }
  }

  public static async getAdminAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { dateFrom, dateTo, status, method, paymentMode, orderType, groupBy } = req.query;
      const analytics = await PaymentAnalyticsService.getRevenueSummary({
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        status: status ? (status as string).split(",") as any : undefined,
        method: method ? (method as string).split(",") as any : undefined,
        paymentMode: paymentMode ? (paymentMode as string).split(",") as any : undefined,
        orderType: orderType ? (orderType as string).split(",") as any : undefined,
        groupBy: groupBy as any,
      });
      return res.status(200).json(new ApiResponse(200, analytics, "Payment analytics fetched successfully."));
    } catch (error) {
      next(error);
    }
  }

  public static async initiateRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const idStr = Array.isArray(id) ? id[0] : id;
      const validated = refundPaymentSchema.parse(req.body);
      const payment = await PaymentService.initiateRefund(idStr, validated);
      return res.status(200).json(new ApiResponse(200, payment, "Refund initiated successfully."));
    } catch (error) {
      next(error);
    }
  }
}

import { Payment, IPayment } from "../../models/payment.model";
import { OrderType, PaymentMethod, PaymentStatus } from "../../common/enum";
import mongoose from "mongoose";

export interface AnalyticsFilters {
  dateFrom?: Date;
  dateTo?: Date;
  status?: PaymentStatus[];
  method?: PaymentMethod[];
  paymentMode?: string[];
  orderType?: OrderType[];
  groupBy?: "day" | "week" | "month" | "method" | "paymentMode" | "orderType";
}

export class PaymentAnalyticsService {
  private static getISTDayRange(date?: Date): { start: Date; end: Date } {
    const target = date ? new Date(date) : new Date();
    // Offset for IST (UTC+5:30)
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(target.getTime() + istOffsetMs);

    const year = istDate.getUTCFullYear();
    const month = istDate.getUTCMonth();
    const day = istDate.getUTCDate();

    // Construct start and end in UTC matching IST 00:00:00 to 23:59:59
    const startIST = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    const start = new Date(startIST.getTime() - istOffsetMs);

    const endIST = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
    const end = new Date(endIST.getTime() - istOffsetMs);

    return { start, end };
  }

  public static async getRevenueSummary(filters: AnalyticsFilters = {}) {
    const matchStage: any = {};

    // Status filter
    if (filters.status && filters.status.length > 0) {
      matchStage.status = { $in: filters.status };
    }

    // Method filter
    if (filters.method && filters.method.length > 0) {
      matchStage.method = { $in: filters.method };
    }

    // Payment mode filter
    if (filters.paymentMode && filters.paymentMode.length > 0) {
      matchStage.paymentMode = { $in: filters.paymentMode };
    }

    // Date range filter (Only apply if explicitly supplied)
    if (filters.dateFrom || filters.dateTo) {
      matchStage.capturedAt = {};
      if (filters.dateFrom) matchStage.capturedAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) matchStage.capturedAt.$lte = new Date(filters.dateTo);
    }

    const pipeline: any[] = [{ $match: matchStage }];

    // If orderType filter is required, lookup order
    if (filters.orderType && filters.orderType.length > 0) {
      pipeline.push(
        {
          $lookup: {
            from: "orders",
            localField: "order",
            foreignField: "_id",
            as: "orderDoc",
          },
        },
        { $unwind: "$orderDoc" },
        { $match: { "orderDoc.orderType": { $in: filters.orderType } } }
      );
    }

    const facetStage: any = {
      totals: [
        {
          $group: {
            _id: null,
            totalVolume: {
              $sum: {
                $cond: [{ $eq: ["$status", PaymentStatus.PAID] }, "$amount", 0],
              },
            },
            successfulPayments: {
              $sum: {
                $cond: [{ $eq: ["$status", PaymentStatus.PAID] }, 1, 0],
              },
            },
            grossAmount: { $sum: "$amount" },
            refundedAmount: {
              $sum: {
                $reduce: {
                  input: "$refunds",
                  initialValue: 0,
                  in: { $add: ["$$value", "$$this.amount"] },
                },
              },
            },
            netAmount: {
              $sum: {
                $subtract: [
                  "$amount",
                  {
                    $reduce: {
                      input: "$refunds",
                      initialValue: 0,
                      in: { $add: ["$$value", "$$this.amount"] },
                    },
                  },
                ],
              },
            },
            totalCount: { $sum: 1 },
          },
        },
      ],
    };

    if (filters.groupBy) {
      let groupExpr: any;
      if (filters.groupBy === "method") {
        groupExpr = "$method";
      } else if (filters.groupBy === "paymentMode") {
        groupExpr = "$paymentMode";
      } else if (filters.groupBy === "orderType") {
        groupExpr = "$orderDoc.orderType";
      } else if (filters.groupBy === "day") {
        groupExpr = { $dateToString: { format: "%Y-%m-%d", date: "$capturedAt", timezone: "+05:30" } };
      } else if (filters.groupBy === "week") {
        groupExpr = { $isoWeek: { date: "$capturedAt", timezone: "+05:30" } };
      } else if (filters.groupBy === "month") {
        groupExpr = { $dateToString: { format: "%Y-%m", date: "$capturedAt", timezone: "+05:30" } };
      }

      facetStage.byGroup = [
        {
          $group: {
            _id: groupExpr,
            grossAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { grossAmount: -1 } },
      ];
    }

    pipeline.push({ $facet: facetStage });

    const results = await Payment.aggregate(pipeline);
    const totals = results[0]?.totals[0] || {
      totalVolume: 0,
      successfulPayments: 0,
      grossAmount: 0,
      refundedAmount: 0,
      netAmount: 0,
      totalCount: 0,
    };
    const byGroup = results[0]?.byGroup || [];

    return {
      totals,
      byGroup,
    };
  }
}

export default PaymentAnalyticsService;

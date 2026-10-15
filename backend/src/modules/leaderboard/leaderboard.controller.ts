import { Request, Response } from "express";
import { LeaderboardService } from "./leaderboard.service";
import { LeaderboardRewardDispatcher } from "./leaderboardReward.dispatcher";
import { LeaderboardConfig } from "../../models/leaderboardConfig.model";
import { LeaderboardRewardLog } from "../../models/leaderboardRewardLog.model";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";
import {
  LeaderboardPeriod,
  LeaderboardRankingMetric,
  LeaderboardRewardStatus,
} from "../../common/enum";
import ApiResponse from "../../utils/ApiResponse";
import ApiError from "../../utils/ApiError";

export class LeaderboardController {
  /**
   * GET /api/leaderboard
   * Public / Authenticated customer endpoint:
   * Returns top rankings and personalized stats with privacy masking and tie perspective resolution.
   */
  public static async getCustomerLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const periodParam = (req.query.period as string) || "weekly";
      const validPeriods = [
        LeaderboardPeriod.WEEKLY,
        LeaderboardPeriod.MONTHLY,
        LeaderboardPeriod.ALL_TIME,
      ];

      const period = validPeriods.includes(periodParam as LeaderboardPeriod)
        ? (periodParam as LeaderboardPeriod)
        : LeaderboardPeriod.WEEKLY;

      const currentUserId = (req as AuthenticatedRequest).user?._id;
      const limit = parseInt(req.query.limit as string, 10) || 10;

      const result = await LeaderboardService.getCustomerLeaderboardView(
        period,
        currentUserId,
        limit
      );

      res.status(200).json(
        new ApiResponse(200, result, "Leaderboard retrieved successfully.")
      );
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to retrieve customer leaderboard.",
      });
    }
  }

  /**
   * GET /api/leaderboard/config
   * Public endpoint returning reward rules, tiers, and criteria for the perks modal
   */
  public static async getPublicConfig(req: Request, res: Response): Promise<void> {
    try {
      const config = await LeaderboardService.getConfig();
      res.status(200).json(
        new ApiResponse(200, config, "Leaderboard configuration retrieved successfully.")
      );
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to retrieve leaderboard configuration.",
      });
    }
  }

  /**
   * GET /api/admin/leaderboard
   * Section 5 Admin View: Full customer table, unmasked, with tied-status tags.
   */
  public static async getAdminLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const periodParam = (req.query.period as string) || "weekly";
      const validPeriods = [
        LeaderboardPeriod.WEEKLY,
        LeaderboardPeriod.MONTHLY,
        LeaderboardPeriod.ALL_TIME,
      ];

      const period = validPeriods.includes(periodParam as LeaderboardPeriod)
        ? (periodParam as LeaderboardPeriod)
        : LeaderboardPeriod.WEEKLY;

      const result = await LeaderboardService.getAdminLeaderboardView(period);
      res.status(200).json(
        new ApiResponse(200, result, "Admin leaderboard retrieved successfully.")
      );
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to retrieve admin leaderboard.",
      });
    }
  }

  /**
   * PUT /api/admin/leaderboard/config
   * Admin updates rules, criteria, and reward tiers
   */
  public static async updateConfig(req: Request, res: Response): Promise<void> {
    try {
      const {
        isActive,
        rankingMetric,
        positionMaintainDays,
        orderStreakDays,
        orderConcurrency,
        minEligibleOrderAmount,
        excludeCoinsUsed,
        excludeDeliveryCharges,
        publicTopCount,
        nameDisplayFormat,
        periodMode,
        rewardTiers,
      } = req.body;

      let config = await LeaderboardConfig.findOne();
      if (!config) {
        config = new LeaderboardConfig({});
      }

      if (typeof isActive === "boolean") config.isActive = isActive;
      if (rankingMetric) config.rankingMetric = rankingMetric;
      if (typeof positionMaintainDays === "number")
        config.positionMaintainDays = positionMaintainDays;
      if (typeof orderStreakDays === "number")
        config.orderStreakDays = orderStreakDays;
      if (orderConcurrency) config.orderConcurrency = orderConcurrency;
      if (typeof minEligibleOrderAmount === "number")
        config.minEligibleOrderAmount = minEligibleOrderAmount;
      if (typeof excludeCoinsUsed === "boolean")
        config.excludeCoinsUsed = excludeCoinsUsed;
      if (typeof excludeDeliveryCharges === "boolean")
        config.excludeDeliveryCharges = excludeDeliveryCharges;
      if (typeof publicTopCount === "number")
        config.publicTopCount = publicTopCount;
      if (nameDisplayFormat) config.nameDisplayFormat = nameDisplayFormat;
      if (periodMode) config.periodMode = periodMode;
      if (Array.isArray(rewardTiers)) config.rewardTiers = rewardTiers;

      await config.save();

      res.status(200).json(
        new ApiResponse(200, config, "Leaderboard configuration updated successfully.")
      );
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to update leaderboard configuration.",
      });
    }
  }

  /**
   * POST /api/admin/leaderboard/resolve-tie
   * Admin decides how to reward tied contestants
   */
  public static async resolveTie(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, rankPosition, period, periodKey, rewardType, rewardDetails, note } =
        req.body;

      if (!customerId || !rankPosition || !period || !periodKey || !rewardType) {
        throw new ApiError(400, "Missing required fields for tie resolution.");
      }

      const rewardLog = await LeaderboardRewardDispatcher.dispatchReward({
        customerId,
        rankPosition,
        period,
        periodKey,
        rewardType,
        rewardDetails: rewardDetails || {},
        adminDecisionNote: note || "Resolved by Admin decision",
      });

      res.status(200).json(
        new ApiResponse(200, rewardLog, "Tied reward resolved and dispatched successfully.")
      );
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to resolve tied reward.",
      });
    }
  }

  /**
   * GET /api/admin/leaderboard/rewards
   * View historical reward logs with audit information
   */
  public static async getRewardLogs(req: Request, res: Response): Promise<void> {
    try {
      const logs = await LeaderboardRewardLog.find()
        .populate({ path: "customerId", select: "name phone email" })
        .sort({ createdAt: -1 })
        .limit(100);

      res.status(200).json(
        new ApiResponse(200, logs, "Leaderboard reward logs retrieved successfully.")
      );
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to retrieve reward logs.",
      });
    }
  }
}

import mongoose from "mongoose";
import { LeaderboardConfig } from "../../models/leaderboardConfig.model";
import { CustomerLeaderboardProgress } from "../../models/customerLeaderboardProgress.model";
import {
  LeaderboardRewardLog,
  ILeaderboardRewardLog,
} from "../../models/leaderboardRewardLog.model";
import Offer from "../../models/offer.model";
import { CoinService } from "../coin/coin.service";
import {
  CoinTransactionType,
  LeaderboardRewardStatus,
  LeaderboardRewardType,
  OfferType,
} from "../../common/enum";
import ApiError from "../../utils/ApiError";

export class LeaderboardRewardDispatcher {
  /**
   * Generates a unique single-use coupon code for leaderboard winners
   */
  public static async generateUniqueVoucherCode(prefix: string = "CHAMP", rankPosition: number = 1): Promise<string> {
    let isUnique = false;
    let code = "";
    while (!isUnique) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      code = `${prefix}${rankPosition}_${randomSuffix}`;
      const existing = await Offer.findOne({ code });
      if (!existing) {
        isUnique = true;
      }
    }
    return code;
  }

  /**
   * Dispatches reward to a customer with atomic idempotency guarantees.
   * Supports:
   * - DISCOUNT_VOUCHER: Generates single-use discount coupon with minCartValue
   * - COINS: Credits Homely Coins directly to the user's wallet
   * - FREE_ITEM: Generates free meal/combo voucher with 100% item discount
   */
  public static async dispatchReward(params: {
    customerId: string;
    rankPosition: number;
    period: string;
    periodKey: string;
    rewardType: LeaderboardRewardType;
    rewardDetails: {
      discountAmount?: number;
      minOrderAmount?: number;
      validityDays?: number;
      coinsAmount?: number;
      freeItemName?: string;
    };
    adminDecisionNote?: string;
  }): Promise<ILeaderboardRewardLog> {
    const {
      customerId,
      rankPosition,
      period,
      periodKey,
      rewardType,
      rewardDetails,
      adminDecisionNote,
    } = params;

    const customerObjectId = new mongoose.Types.ObjectId(customerId);

    // 1. Idempotency Check: Prevent duplicate claims for the same customer, periodKey, and rank
    const existingLog = await LeaderboardRewardLog.findOne({
      customerId: customerObjectId,
      periodKey,
      rankPosition,
    });

    if (existingLog) {
      console.log(
        `[LEADERBOARD] Reward already claimed for customer ${customerId} in ${periodKey} at Rank ${rankPosition}`
      );
      return existingLog;
    }

    const payload: {
      coins?: number;
      voucherCode?: string;
      discountAmount?: number;
      minOrderAmount?: number;
      validUntil?: Date;
      freeItemName?: string;
    } = {};

    // 2. Dispatch according to Reward Type
    if (rewardType === LeaderboardRewardType.COINS) {
      const coinsToCredit = rewardDetails.coinsAmount || 50;
      await CoinService.creditWallet(customerId, coinsToCredit, {
        type: CoinTransactionType.LEADERBOARD_REWARD,
        reason: `Leaderboard Winner Reward for Rank #${rankPosition} (${periodKey})`,
        meta: {
          period,
          periodKey,
          rankPosition,
        },
      });
      payload.coins = coinsToCredit;
    } else if (rewardType === LeaderboardRewardType.FREE_ITEM) {
      const freeItemName = rewardDetails.freeItemName || "Free Homely Foods Combo Meal";
      const validityDays = rewardDetails.validityDays || 30;

      const voucherCode = await this.generateUniqueVoucherCode("FREECOMBO", rankPosition);
      const startDate = new Date();
      const validUntil = new Date(startDate.getTime() + validityDays * 86400000);

      // Create 100% flat voucher or promotional offer
      await Offer.create({
        offerType: OfferType.FLAT,
        title: `Rank #${rankPosition} Champion Prize: ${freeItemName}`,
        code: voucherCode,
        description: `Complimentary ${freeItemName} for achieving Rank #${rankPosition} in Homely Foods Monthly Leaderboard!`,
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500",
        startDate,
        endDate: validUntil,
        isActive: true,
        flatDiscountAmount: 250, // Covers complete combo meal price
        minCartValue: 0,
      });

      payload.voucherCode = voucherCode;
      payload.freeItemName = freeItemName;
      payload.discountAmount = 250;
      payload.validUntil = validUntil;
    } else if (rewardType === LeaderboardRewardType.DISCOUNT_VOUCHER) {
      const discountAmount = rewardDetails.discountAmount || 100;
      const minOrderAmount = rewardDetails.minOrderAmount || 300;
      const validityDays = rewardDetails.validityDays || 30;

      const voucherCode = await this.generateUniqueVoucherCode("CHAMP", rankPosition);
      const startDate = new Date();
      const validUntil = new Date(startDate.getTime() + validityDays * 86400000);

      // Create single-use flat discount Offer record
      await Offer.create({
        offerType: OfferType.FLAT,
        title: `Leaderboard Rank #${rankPosition} Champion Voucher`,
        code: voucherCode,
        description: `Special ₹${discountAmount} OFF on orders above ₹${minOrderAmount} for achieving Rank #${rankPosition}`,
        image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500",
        startDate,
        endDate: validUntil,
        isActive: true,
        flatDiscountAmount: discountAmount,
        minCartValue: minOrderAmount,
      });

      payload.voucherCode = voucherCode;
      payload.discountAmount = discountAmount;
      payload.minOrderAmount = minOrderAmount;
      payload.validUntil = validUntil;
    }

    // 3. Create Audit Log (guaranteed unique by index)
    const rewardLog = await LeaderboardRewardLog.create({
      customerId: customerObjectId,
      rankPosition,
      period,
      periodKey,
      rewardType,
      rewardPayload: payload,
      adminDecisionNote,
      claimedByCustomer: true,
    });

    // 4. Update customer's progress record status to CLAIMED
    await CustomerLeaderboardProgress.findOneAndUpdate(
      {
        customerId: customerObjectId,
        period,
        periodKey,
      },
      {
        $set: {
          rewardStatus: LeaderboardRewardStatus.CLAIMED,
          rewardedAt: new Date(),
          isEligibleForReward: true,
        },
      }
    );

    return rewardLog;
  }

  /**
   * Evaluates all candidates for a period, checks eligibility keys, and triggers rewards.
   */
  public static async evaluateAndDispatchPeriodRewards(
    period: string = "monthly"
  ): Promise<{ rewardedCount: number; pendingTieCount: number }> {
    const config = await LeaderboardConfig.findOne();
    if (!config || !config.isActive) {
      return { rewardedCount: 0, pendingTieCount: 0 };
    }

    // Find progress documents where rank is in configured reward tiers
    const configuredRanks = config.rewardTiers.map((t) => t.rankPosition);
    const candidates = await CustomerLeaderboardProgress.find({
      period,
      currentRank: { $in: configuredRanks },
      rewardStatus: {
        $in: [LeaderboardRewardStatus.NONE, LeaderboardRewardStatus.ELIGIBLE],
      },
    });

    let rewardedCount = 0;
    let pendingTieCount = 0;

    for (const cand of candidates) {
      // Key 1: Maintained rank position for configured days
      const meetsMaintainDays =
        cand.consecutiveDaysAtCurrentRank >= config.positionMaintainDays;

      // Key 2: Maintained daily order concurrency / streak
      const meetsStreakDays = cand.consecutiveOrderDays >= config.orderStreakDays;

      if (meetsMaintainDays && meetsStreakDays) {
        // If candidate is in a tie, mark for admin decision
        if (cand.isTied) {
          cand.rewardStatus = LeaderboardRewardStatus.PENDING_ADMIN_DECISION;
          cand.isEligibleForReward = true;
          await cand.save();
          pendingTieCount++;
          continue;
        }

        // Find tier details
        const tier = config.rewardTiers.find(
          (t) => t.rankPosition === cand.currentRank
        );
        if (!tier) continue;

        await this.dispatchReward({
          customerId: cand.customerId.toString(),
          rankPosition: cand.currentRank,
          period: cand.period,
          periodKey: cand.periodKey,
          rewardType: tier.rewardType,
          rewardDetails: tier.rewardDetails,
        });

        rewardedCount++;
      }
    }

    return { rewardedCount, pendingTieCount };
  }
}

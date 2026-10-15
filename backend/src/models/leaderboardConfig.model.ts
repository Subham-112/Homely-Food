import mongoose, { Document, Schema } from "mongoose";
import {
  LeaderboardRewardType,
  LeaderboardRankingMetric,
  LeaderboardPeriodMode,
  NameDisplayFormat,
} from "../common/enum";

export interface IRewardTier {
  rankPosition: number;
  title: string;
  badgeColor?: string;
  rewardType: LeaderboardRewardType;
  rewardDetails: {
    discountAmount?: number;
    minOrderAmount?: number;
    validityDays?: number;
    coinsAmount?: number;
    freeItemName?: string;
  };
}

export interface ILeaderboardConfig extends Document {
  isActive: boolean;
  rankingMetric: LeaderboardRankingMetric;
  positionMaintainDays: number;
  orderStreakDays: number;
  orderConcurrency: string;
  timezone: string;
  rewardCooldownPerCycle: boolean;
  minEligibleOrderAmount: number;
  excludeCoinsUsed: boolean;
  excludeDeliveryCharges: boolean;
  publicTopCount: number;
  nameDisplayFormat: NameDisplayFormat;
  periodMode: LeaderboardPeriodMode;
  rewardTiers: IRewardTier[];
  createdAt: Date;
  updatedAt: Date;
}

const RewardTierSchema = new Schema<IRewardTier>(
  {
    rankPosition: {
      type: Number,
      required: true,
      min: 1,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    badgeColor: {
      type: String,
      default: "#F59E0B",
    },
    rewardType: {
      type: String,
      enum: Object.values(LeaderboardRewardType),
      required: true,
    },
    rewardDetails: {
      discountAmount: { type: Number, min: 0 },
      minOrderAmount: { type: Number, min: 0 },
      validityDays: { type: Number, min: 1, default: 30 },
      coinsAmount: { type: Number, min: 0 },
      freeItemName: { type: String, trim: true },
    },
  },
  { _id: false }
);

const LeaderboardConfigSchema = new Schema<ILeaderboardConfig>(
  {
    isActive: {
      type: Boolean,
      default: true,
    },
    rankingMetric: {
      type: String,
      enum: Object.values(LeaderboardRankingMetric),
      default: LeaderboardRankingMetric.TOTAL_SPENDING,
    },
    positionMaintainDays: {
      type: Number,
      default: 5,
      min: 1,
    },
    orderStreakDays: {
      type: Number,
      default: 5,
      min: 1,
    },
    orderConcurrency: {
      type: String,
      default: "daily",
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
    rewardCooldownPerCycle: {
      type: Boolean,
      default: true,
    },
    minEligibleOrderAmount: {
      type: Number,
      default: 80,
      min: 0,
    },
    excludeCoinsUsed: {
      type: Boolean,
      default: true,
    },
    excludeDeliveryCharges: {
      type: Boolean,
      default: true,
    },
    publicTopCount: {
      type: Number,
      default: 5,
      min: 3,
      max: 50,
    },
    nameDisplayFormat: {
      type: String,
      enum: Object.values(NameDisplayFormat),
      default: NameDisplayFormat.INITIALS,
    },
    periodMode: {
      type: String,
      enum: Object.values(LeaderboardPeriodMode),
      default: LeaderboardPeriodMode.MONTHLY_ONLY,
    },
    rewardTiers: {
      type: [RewardTierSchema],
      default: [
        {
          rankPosition: 1,
          title: "Free Homely Foods Combo Meal",
          badgeColor: "#F59E0B",
          rewardType: LeaderboardRewardType.FREE_ITEM,
          rewardDetails: {
            freeItemName: "Free Homely Foods Combo Meal",
            validityDays: 30,
          },
        },
        {
          rankPosition: 2,
          title: "₹150 Homely Foods Voucher",
          badgeColor: "#9CA3AF",
          rewardType: LeaderboardRewardType.DISCOUNT_VOUCHER,
          rewardDetails: {
            discountAmount: 150,
            minOrderAmount: 350,
            validityDays: 30,
          },
        },
        {
          rankPosition: 3,
          title: "₹100 Homely Foods Voucher",
          badgeColor: "#D97706",
          rewardType: LeaderboardRewardType.DISCOUNT_VOUCHER,
          rewardDetails: {
            discountAmount: 100,
            minOrderAmount: 300,
            validityDays: 30,
          },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

export const LeaderboardConfig = mongoose.model<ILeaderboardConfig>(
  "LeaderboardConfig",
  LeaderboardConfigSchema
);

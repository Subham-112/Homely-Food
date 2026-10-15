import mongoose, { Document, Schema } from "mongoose";
import { LeaderboardPeriod, LeaderboardRewardStatus } from "../common/enum";

export interface ICustomerLeaderboardProgress extends Document {
  customerId: mongoose.Types.ObjectId;
  period: LeaderboardPeriod;
  periodKey: string;
  totalSpending: number;
  completedOrdersCount: number;
  totalCoinsEarned: number;
  currentRank: number;
  isTied: boolean;
  tiedWithCustomerIds: mongoose.Types.ObjectId[];
  consecutiveDaysAtCurrentRank: number;
  consecutiveOrderDays: number;
  gapToFirst: number;
  lastOrderDateIST?: string;
  isEligibleForReward: boolean;
  rewardStatus: LeaderboardRewardStatus;
  rewardedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerLeaderboardProgressSchema = new Schema<ICustomerLeaderboardProgress>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    period: {
      type: String,
      enum: Object.values(LeaderboardPeriod),
      required: true,
    },
    periodKey: {
      type: String,
      required: true,
      index: true,
    },
    totalSpending: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedOrdersCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCoinsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentRank: {
      type: Number,
      default: 0,
      min: 0,
    },
    isTied: {
      type: Boolean,
      default: false,
    },
    tiedWithCustomerIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    consecutiveDaysAtCurrentRank: {
      type: Number,
      default: 1,
      min: 0,
    },
    consecutiveOrderDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    gapToFirst: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastOrderDateIST: {
      type: String,
    },
    isEligibleForReward: {
      type: Boolean,
      default: false,
    },
    rewardStatus: {
      type: String,
      enum: Object.values(LeaderboardRewardStatus),
      default: LeaderboardRewardStatus.NONE,
    },
    rewardedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee 1 progress document per customer per period cycle
CustomerLeaderboardProgressSchema.index(
  { customerId: 1, period: 1, periodKey: 1 },
  { unique: true }
);

// Query index for sorting by rank within a period
CustomerLeaderboardProgressSchema.index({
  period: 1,
  periodKey: 1,
  currentRank: 1,
});

export const CustomerLeaderboardProgress =
  mongoose.model<ICustomerLeaderboardProgress>(
    "CustomerLeaderboardProgress",
    CustomerLeaderboardProgressSchema
  );

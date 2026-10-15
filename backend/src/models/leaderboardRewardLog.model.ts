import mongoose, { Document, Schema } from "mongoose";
import { LeaderboardRewardType } from "../common/enum";

export interface ILeaderboardRewardLog extends Document {
  customerId: mongoose.Types.ObjectId;
  rankPosition: number;
  period: string;
  periodKey: string;
  rewardType: LeaderboardRewardType;
  rewardPayload: {
    coins?: number;
    voucherCode?: string;
    discountAmount?: number;
    minOrderAmount?: number;
    validUntil?: Date;
    freeItemName?: string;
  };
  adminDecisionNote?: string;
  claimedByCustomer: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LeaderboardRewardLogSchema = new Schema<ILeaderboardRewardLog>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rankPosition: {
      type: Number,
      required: true,
      min: 1,
    },
    period: {
      type: String,
      required: true,
    },
    periodKey: {
      type: String,
      required: true,
      index: true,
    },
    rewardType: {
      type: String,
      enum: Object.values(LeaderboardRewardType),
      required: true,
    },
    rewardPayload: {
      coins: { type: Number },
      voucherCode: { type: String, trim: true },
      discountAmount: { type: Number },
      minOrderAmount: { type: Number },
      validUntil: { type: Date },
      freeItemName: { type: String, trim: true },
    },
    adminDecisionNote: {
      type: String,
      trim: true,
    },
    claimedByCustomer: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique Index: Strictly prevents duplicate payouts per customer per period cycle & rank
LeaderboardRewardLogSchema.index(
  { customerId: 1, periodKey: 1, rankPosition: 1 },
  { unique: true }
);

export const LeaderboardRewardLog = mongoose.model<ILeaderboardRewardLog>(
  "LeaderboardRewardLog",
  LeaderboardRewardLogSchema
);

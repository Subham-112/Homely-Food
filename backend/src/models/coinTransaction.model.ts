import mongoose, { Schema, Document } from "mongoose";
import { CoinTransactionType, CoinTransactionDirection } from "../common/enum";

export interface ICoinTransaction extends Document {
  user: mongoose.Types.ObjectId;
  type: CoinTransactionType;
  direction: CoinTransactionDirection;
  amount: number;
  balanceAfter: number;
  order?: mongoose.Types.ObjectId;
  tier?: mongoose.Types.ObjectId;
  performedByAdmin?: mongoose.Types.ObjectId;
  reason: string;
  meta?: Record<string, any>;
  createdAt: Date;
}

const CoinTransactionSchema = new Schema<ICoinTransaction>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(CoinTransactionType),
      required: true,
    },
    direction: {
      type: String,
      enum: Object.values(CoinTransactionDirection),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      index: true,
    },
    tier: {
      type: Schema.Types.ObjectId,
      ref: "CoinRule",
    },
    performedByAdmin: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    reason: {
      type: String,
      required: true,
    },
    meta: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

CoinTransactionSchema.index({ user: 1, createdAt: -1 });
CoinTransactionSchema.index({ order: 1, type: 1 }, { unique: true, partialFilterExpression: { order: { $exists: true } } });

export const CoinTransaction = mongoose.model<ICoinTransaction>("CoinTransaction", CoinTransactionSchema);

import mongoose, { Schema, Document } from "mongoose";

export interface ICoinWallet extends Document {
  user: mongoose.Types.ObjectId;
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  lifetimeExpired: number;
  achievedTierIds: mongoose.Types.ObjectId[];
  nextExpiryCheckAt?: Date | null;
  lastCreditedAt?: Date;
  lastDebitedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CoinWalletSchema = new Schema<ICoinWallet>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    lifetimeEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    lifetimeSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    lifetimeExpired: {
      type: Number,
      default: 0,
      min: 0,
    },
    achievedTierIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "CoinRule",
      },
    ],
    nextExpiryCheckAt: {
      type: Date,
      default: null,
      index: true,
    },
    lastCreditedAt: {
      type: Date,
    },
    lastDebitedAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

CoinWalletSchema.index({ nextExpiryCheckAt: 1, balance: 1 });

export const CoinWallet = mongoose.model<ICoinWallet>("CoinWallet", CoinWalletSchema);

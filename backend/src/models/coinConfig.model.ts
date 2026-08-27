import mongoose, { Schema, Document } from "mongoose";

export interface ICoinConfig extends Document {
  coinToRupeeRatio: number;
  welcomeBonusCoins: number;
  expiryInactivityDays: number;
  extendExpiryOnEarn: boolean;
  isCoinSystemEnabled: boolean;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CoinConfigSchema = new Schema<ICoinConfig>(
  {
    coinToRupeeRatio: {
      type: Number,
      default: 1,
    },
    welcomeBonusCoins: {
      type: Number,
      default: 50,
    },
    expiryInactivityDays: {
      type: Number,
      default: 30,
    },
    extendExpiryOnEarn: {
      type: Boolean,
      default: false,
    },
    isCoinSystemEnabled: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

export const CoinConfig = mongoose.model<ICoinConfig>("CoinConfig", CoinConfigSchema);

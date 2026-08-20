import mongoose, { Schema, Document } from "mongoose";
import mongooseDelete, { SoftDeleteDocument } from "mongoose-delete";

export interface ICoinRule extends SoftDeleteDocument {
  label: string;
  minOrderAmount: number;
  fixedCoins: number;
  isBaseTier: boolean;
  repeatCapCoins?: number;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CoinRuleSchema = new Schema<ICoinRule>(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    minOrderAmount: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    fixedCoins: {
      type: Number,
      required: true,
      min: 0,
    },
    isBaseTier: {
      type: Boolean,
      default: false,
    },
    repeatCapCoins: {
      type: Number,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
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

CoinRuleSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: "all" });

export const CoinRule = mongoose.model<ICoinRule>("CoinRule", CoinRuleSchema);

import mongoose, { Schema } from "mongoose";
import mongooseDelete, { SoftDeleteDocument } from "mongoose-delete";

export interface ICoinRedemptionRule extends SoftDeleteDocument {
  label?: string;
  minOrderAmount: number;
  maxCoinsDeductible: number;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CoinRedemptionRuleSchema = new Schema<ICoinRedemptionRule>(
  {
    label: {
      type: String,
      trim: true,
    },
    minOrderAmount: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    maxCoinsDeductible: {
      type: Number,
      required: true,
      min: 1,
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

CoinRedemptionRuleSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: "all" });

export const CoinRedemptionRule = mongoose.model<ICoinRedemptionRule>(
  "CoinRedemptionRule",
  CoinRedemptionRuleSchema
);
export default CoinRedemptionRule;

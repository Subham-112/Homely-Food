import mongoose, { Schema } from "mongoose";
import mongooseDelete from "mongoose-delete";
import { ISoftDeleteDocument, ISoftDeleteModel } from "../types/softDelete";

export interface IGroupDiscount {
  type: "percentage" | "flat";
  value: number;
  maxOrdersPerCustomer: number; // 0 means unlimited
  minOrderAmount: number; // Min subtotal required
  active: boolean;
  validUntil?: Date;
}

export interface ICustomerGroup extends ISoftDeleteDocument {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  color?: string; // Optional badge color tag (e.g., emerald, blue, purple, amber)
  customerIds: mongoose.Types.ObjectId[];
  discount?: IGroupDiscount;
  // Per customer discount usage tracking (counts how many orders a customer has completed/used this perk)
  usedCounts?: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const GroupDiscountSchema = new Schema<IGroupDiscount>(
  {
    type: {
      type: String,
      enum: ["percentage", "flat"],
      default: "percentage",
    },
    value: {
      type: Number,
      default: 0,
    },
    maxOrdersPerCustomer: {
      type: Number,
      default: 0, // 0 = unlimited
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: false,
    },
    validUntil: {
      type: Date,
    },
  },
  { _id: false }
);

const CustomerGroupSchema = new Schema<ICustomerGroup>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: "emerald",
      trim: true,
    },
    customerIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Customer",
      },
    ],
    discount: {
      type: GroupDiscountSchema,
      default: () => ({
        type: "percentage",
        value: 0,
        maxOrdersPerCustomer: 0,
        minOrderAmount: 0,
        active: false,
      }),
    },
    usedCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

CustomerGroupSchema.plugin(mongooseDelete, { overrideMethods: "all", deletedAt: true });

export const CustomerGroup = mongoose.model<ICustomerGroup, ISoftDeleteModel<ICustomerGroup>>(
  "CustomerGroup",
  CustomerGroupSchema
);

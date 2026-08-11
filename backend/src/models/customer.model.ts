import mongoose, { Schema } from "mongoose";
import mongooseDelete from "mongoose-delete";
import { ISoftDeleteDocument, ISoftDeleteModel } from "../types/softDelete";

export interface ICustomerName {
  name: string;
  addedAt: Date;
}

export interface ICustomer extends ISoftDeleteDocument {
  phone: string;
  user?: mongoose.Types.ObjectId;
  primaryName: string;
  names: ICustomerName[];
  orderCount: number;
  totalExpenses: number;
  customerType: "registered" | "guest";
  createdAt: Date;
  updatedAt: Date;
}

const CustomerNameSchema: Schema<ICustomerName> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const CustomerSchema: Schema<ICustomer> = new Schema(
  {
    phone: {
      type: String,
      unique: true,
      trim: true,
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      sparse: true,
    },
    primaryName: {
      type: String,
      required: true,
      trim: true,
    },
    names: {
      type: [CustomerNameSchema],
      default: [],
    },
    orderCount: {
      type: Number,
      default: 0,
    },
    totalExpenses: {
      type: Number,
      default: 0,
    },
    customerType: {
      type: String,
      enum: ["registered", "guest"],
      required: true,
      default: "guest",
    },
  },
  {
    timestamps: true,
  }
);

CustomerSchema.plugin(mongooseDelete, { overrideMethods: "all", deletedAt: true });

export const Customer = mongoose.model<ICustomer, ISoftDeleteModel<ICustomer>>(
  "Customer",
  CustomerSchema
);

import mongoose, { Schema, Document } from "mongoose";
import { OfferType } from "../common/enum";

export interface IOffer extends Document {
  offerType: OfferType;
  title: string;
  code: string;
  description?: string;
  image: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  
  // BOGO Fields
  buyItem?: mongoose.Types.ObjectId;
  buyQuantity?: number;
  freeItem?: mongoose.Types.ObjectId;
  freeQuantity?: number;

  // Percentage & Flat Fields
  minCartValue?: number;
  discountPercentage?: number;
  flatDiscountAmount?: number;
  maxDiscountAmount?: number;

  createdAt: Date;
  updatedAt: Date;
}

const OfferSchema: Schema = new Schema(
  {
    offerType: {
      type: String,
      enum: Object.values(OfferType),
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    image: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // BOGO details
    buyItem: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
    },
    buyQuantity: {
      type: Number,
    },
    freeItem: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
    },
    freeQuantity: {
      type: Number,
    },

    // Percentage & Flat details
    minCartValue: {
      type: Number,
    },
    discountPercentage: {
      type: Number,
    },
    flatDiscountAmount: {
      type: Number,
    },
    maxDiscountAmount: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

export const Offer = mongoose.model<IOffer>("Offer", OfferSchema);
export default Offer;

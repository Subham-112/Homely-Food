import mongoose, { Document, Schema } from "mongoose";

export interface IAddress {
  street?: string;
  area?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface IShopDetails extends Document {
  _id: mongoose.Types.ObjectId;
  shopName: string;
  ownerName?: string;
  emails?: string[];
  phones?: string[];
  address?: IAddress;
  serviceablePincodes?: string[];
  logo?: string;
  bannerImage?: string;
  openingTime?: string;
  closingTime?: string;
  isStoreOpen: boolean;
  isDeliveryEnabled: boolean;
  minimumOrderAmount?: number;
  deliveryCharge?: number;
  freeDeliveryThreshold?: number;
  discountMode?: "global" | "item_only" | "hybrid" | "none";
  globalDiscountPercent?: number;
  fssaiLicenseNumber?: string;
  gstNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    street: { type: String, trim: true, default: "" },
    area: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "Surat" },
    state: { type: String, trim: true, default: "Gujarat" },
    pincode: { type: String, trim: true, default: "395007" },
    landmark: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const ShopDetailsSchema = new Schema<IShopDetails>(
  {
    shopName: {
      type: String,
      required: [true, "Shop name is required"],
      trim: true,
      default: "Homely Food",
    },
    ownerName: {
      type: String,
      trim: true,
      default: "Homely Food Admin",
    },
    emails: {
      type: [String],
      default: [],
    },
    phones: {
      type: [String],
      default: [],
    },
    address: {
      type: AddressSchema,
      default: () => ({}),
    },
    serviceablePincodes: {
      type: [String],
      default: [],
    },
    logo: {
      type: String,
    },
    bannerImage: {
      type: String,
    },
    openingTime: {
      type: String,
    },
    closingTime: {
      type: String,
    },
    isStoreOpen: {
      type: Boolean,
      default: true,
    },
    isDeliveryEnabled: {
      type: Boolean,
      default: true,
    },
    minimumOrderAmount: {
      type: Number,
    },
    deliveryCharge: {
      type: Number,
    },
    freeDeliveryThreshold: {
      type: Number,
    },
    discountMode: {
      type: String,
      enum: ["global", "item_only", "hybrid", "none"],
      default: "hybrid",
    },
    globalDiscountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    fssaiLicenseNumber: {
      type: String,
    },
    gstNumber: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const ShopDetails = mongoose.model<IShopDetails>("ShopDetails", ShopDetailsSchema);
export default ShopDetails;

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
  ownerName: string;
  emails: string[];
  phones: string[];
  address: IAddress;
  serviceablePincodes: string[];
  logo?: string;
  bannerImage?: string;
  openingTime?: string;
  closingTime?: string;
  isStoreOpen: boolean;
  minimumOrderAmount?: number;
  deliveryCharge?: number;
  freeDeliveryThreshold?: number;
  fssaiLicenseNumber?: string;
  gstNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    street: { type: String, trim: true, default: "" },
    area: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, required: true, default: "Surat" },
    state: { type: String, trim: true, required: true, default: "Gujarat" },
    pincode: { type: String, trim: true, required: true, default: "395007" },
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
      required: [true, "Owner name is required"],
      trim: true,
      default: "Homely Food Admin",
    },
    emails: {
      type: [String],
      required: true,
      default: ["support@homelyfood.com"],
    },
    phones: {
      type: [String],
      required: true,
      default: ["9876543210"],
    },
    address: {
      type: AddressSchema,
      required: true,
    },
    serviceablePincodes: {
      type: [String],
      default: ["395007", "395001", "395002", "395003", "395004", "395005", "395006"],
    },
    logo: {
      type: String,
      default: "",
    },
    bannerImage: {
      type: String,
      default: "",
    },
    openingTime: {
      type: String,
      default: "08:00 AM",
    },
    closingTime: {
      type: String,
      default: "10:00 PM",
    },
    isStoreOpen: {
      type: Boolean,
      default: true,
    },
    minimumOrderAmount: {
      type: Number,
      default: 100,
    },
    deliveryCharge: {
      type: Number,
      default: 30,
    },
    freeDeliveryThreshold: {
      type: Number,
      default: 500,
    },
    fssaiLicenseNumber: {
      type: String,
      default: "",
    },
    gstNumber: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const ShopDetails = mongoose.model<IShopDetails>("ShopDetails", ShopDetailsSchema);
export default ShopDetails;

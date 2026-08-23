import mongoose, { Schema, Document } from "mongoose";
import { CartStatus } from "../common/enum";

export interface ICartItem {
  menuItem: mongoose.Types.ObjectId;
  quantity: number;
  variant?: mongoose.Types.ObjectId;
  isReorder?: boolean;
}

export interface ICartTotal {
  subTotal: number;
  discount: number;
  totalAmount: number;
  offer?: mongoose.Types.ObjectId;
  offerCode?: string;
  discountType?: "offer" | "coins";
  coinsUsed?: number;
  coinStatus?: "none" | "applied" | "converted" | "cancelled";
}

export interface ICart extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
  total: ICartTotal;
  status: CartStatus;
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    menuItem: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    variant: {
      type: Schema.Types.ObjectId,
      ref: "MenuItemVariant",
    },
    isReorder: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const CartTotalSchema = new Schema<ICartTotal>(
  {
    subTotal: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    offer: {
      type: Schema.Types.ObjectId,
      ref: "Offer",
    },
    offerCode: {
      type: String,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["offer", "coins"],
      default: undefined,
    },
    coinsUsed: {
      type: Number,
      default: 0,
    },
    coinStatus: {
      type: String,
      enum: ["none", "applied", "converted", "cancelled"],
      default: "none",
    },
  },
  { _id: false }
);

const CartSchema: Schema<ICart> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [CartItemSchema],
      default: [],
    },
    total: {
      type: CartTotalSchema,
      default: () => ({
        subTotal: 0,
        discount: 0,
        totalAmount: 0,
      }),
    },
    status: {
      type: String,
      enum: Object.values(CartStatus),
      default: CartStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CartSchema.index({ user: 1, status: 1 });

export const Cart = (mongoose.models.Cart as mongoose.Model<ICart>) || mongoose.model<ICart>("Cart", CartSchema);

// Safely drop obsolete single-field unique index 'user_1' from MongoDB if it exists
Cart.collection.dropIndex("user_1").catch(() => {});

export default Cart;

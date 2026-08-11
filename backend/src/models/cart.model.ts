import mongoose, { Schema } from "mongoose";
import mongooseDelete from "mongoose-delete";
import { ISoftDeleteDocument, ISoftDeleteModel } from "../types/softDelete";

export interface ICartItem {
  menuItem: mongoose.Types.ObjectId;
  quantity: number;
  variant?: mongoose.Types.ObjectId;
}

export interface ICart extends ISoftDeleteDocument {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
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
  },
  { _id: false }
);

const CartSchema: Schema<ICart> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: {
      type: [CartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

CartSchema.plugin(mongooseDelete, { overrideMethods: "all", deletedAt: true, deletedBy: true });

export const Cart: ISoftDeleteModel<ICart> =
  (mongoose.models.Cart as any) ||
  mongoose.model<ICart, ISoftDeleteModel<ICart>>("Cart", CartSchema);
export default Cart;

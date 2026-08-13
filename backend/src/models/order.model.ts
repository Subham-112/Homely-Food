import mongoose, { Schema } from "mongoose";
import mongooseDelete from "mongoose-delete";
import { OrderFor, OrderStatus, OrderType, PaymentMethod, PaymentStatus } from "../common/enum";
import { ISoftDeleteDocument, ISoftDeleteModel } from "../types/softDelete";

export interface IOrderItem {
  menuItem: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  variant?: {
    variantId?: mongoose.Types.ObjectId;
    label?: string;
    price?: number;
  };
}

export interface IPaymentInfo {
  method: PaymentMethod | "";
  status: PaymentStatus;
  transactionId?: string;
  amount: number;
}

export interface IGuestInfo {
  name: string;
  phone: string;
  email?: string;
}

export interface IOrder extends ISoftDeleteDocument {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;
  user?: mongoose.Types.ObjectId;
  customer?: mongoose.Types.ObjectId;
  orderFor: OrderFor;
  guest: IGuestInfo;
  items: IOrderItem[];
  payment: IPaymentInfo;
  status: OrderStatus;
  orderType: OrderType;
  deliveryAddress?: string;
  pickupTiming?: string;
  subTotal: number;
  discount?: number;
  totalAmount: number;
  notes?: string;
  preparingAt?: Date;
  readyAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    menuItem: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    variant: {
      variantId: { type: Schema.Types.ObjectId, ref: "MenuItemVariant" },
      label: { type: String, trim: true },
      price: { type: Number },
    },
  },
  { _id: false }
);

const PaymentInfoSchema = new Schema<IPaymentInfo>(
  {
    method: {
      type: String,
      enum: [...Object.values(PaymentMethod), ""],
      default: "",
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.UNPAID,
    },
    transactionId: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const GuestInfoSchema = new Schema<IGuestInfo>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const OrderSchema: Schema<IOrder> = new Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
    },
    orderFor: {
      type: String,
      enum: Object.values(OrderFor),
      required: true,
      default: OrderFor.GUEST,
    },
    guest: {
      type: GuestInfoSchema,
      required: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
    },
    payment: {
      type: PaymentInfoSchema,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.ACCEPTED,
    },
    orderType: {
      type: String,
      enum: Object.values(OrderType),
      default: OrderType.DINE_IN,
    },
    deliveryAddress: {
      type: String,
      trim: true,
    },
    pickupTiming: {
      type: String,
      trim: true,
    },
    subTotal: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    preparingAt: {
      type: Date,
    },
    readyAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

OrderSchema.plugin(mongooseDelete, { overrideMethods: "all", deletedAt: true, deletedBy: true });

export const Order: ISoftDeleteModel<IOrder> =
  (mongoose.models.Order as any) ||
  mongoose.model<IOrder, ISoftDeleteModel<IOrder>>("Order", OrderSchema);
export default Order;

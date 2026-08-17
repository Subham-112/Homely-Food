import mongoose, { Schema, Document, Model } from "mongoose";
import { PaymentGateway, PaymentMethod, PaymentStatus } from "../common/enum";

export interface IRefundItem {
  refundId: string;
  amount: number;
  status: string;
  reason?: string;
  createdAt: Date;
}

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  order?: mongoose.Types.ObjectId | null;
  draftPayload?: Record<string, any>;
  user?: mongoose.Types.ObjectId;
  gateway: PaymentGateway;
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  amount: number;
  amountInPaise: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  paymentMode?: string;
  attempts: number;
  failureReason?: string;
  refunds: IRefundItem[];
  capturedAt?: Date;
  expiresAt?: Date;
  meta?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const RefundItemSchema = new Schema<IRefundItem>(
  {
    refundId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, required: true, default: "processed" },
    reason: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PaymentSchema: Schema<IPayment> = new Schema(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },
    draftPayload: {
      type: Schema.Types.Mixed,
      default: null,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    gateway: {
      type: String,
      enum: Object.values(PaymentGateway),
      default: PaymentGateway.RAZORPAY,
    },
    gatewayOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    gatewayPaymentId: {
      type: String,
      sparse: true,
      index: true,
    },
    gatewaySignature: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    amountInPaise: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.CREATED,
      index: true,
    },
    method: {
      type: String,
      enum: Object.values(PaymentMethod),
      default: PaymentMethod.RAZORPAY,
    },
    paymentMode: {
      type: String,
      trim: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    failureReason: {
      type: String,
      trim: true,
    },
    refunds: {
      type: [RefundItemSchema],
      default: [],
    },
    capturedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    meta: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

PaymentSchema.index({ status: 1, capturedAt: -1 });
PaymentSchema.index({ user: 1, createdAt: -1 });

export const Payment: Model<IPayment> =
  (mongoose.models.Payment as any) ||
  mongoose.model<IPayment>("Payment", PaymentSchema);
export default Payment;

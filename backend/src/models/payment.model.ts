import mongoose, { Schema, Document, Model } from "mongoose";
import { PaymentGateway, PaymentMethod, PaymentStatus } from "../common/enum";
import { validatePaymentTransition } from "../utils/paymentStateMachine";

export interface IRefundItem {
  refundId: string;
  amount: number;
  status: string;
  reason?: string;
  createdAt: Date;
}

export interface IPaymentDetails {
  bankRrn?: string;
  invoiceId?: string;
  paymentMethodDetails?: {
    type?: string;
    vpa?: string;
    payerAccountType?: string;
    cardNetwork?: string;
    cardType?: string;
    cardLast4?: string;
    bankName?: string;
    walletName?: string;
  };
  customerDetails?: {
    contact?: string;
    email?: string;
  };
  feeDetails?: {
    totalFee: number;
    razorpayFee: number;
    gst: number;
    feeBearer?: string;
  };
  appName?: string;
  appId?: string;
  description?: string;
  notes?: Record<string, string>;
  rawGatewayResponse?: Record<string, any>;
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
  details?: IPaymentDetails;
  meta?: Record<string, any>;
  transitionTo(newStatus: PaymentStatus): void;
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
    details: {
      bankRrn: { type: String, trim: true },
      invoiceId: { type: String, trim: true },
      paymentMethodDetails: {
        type: { type: String, trim: true },
        vpa: { type: String, trim: true },
        payerAccountType: { type: String, trim: true },
        cardNetwork: { type: String, trim: true },
        cardType: { type: String, trim: true },
        cardLast4: { type: String, trim: true },
        bankName: { type: String, trim: true },
        walletName: { type: String, trim: true },
      },
      customerDetails: {
        contact: { type: String, trim: true },
        email: { type: String, trim: true },
      },
      feeDetails: {
        totalFee: { type: Number, default: 0 },
        razorpayFee: { type: Number, default: 0 },
        gst: { type: Number, default: 0 },
        feeBearer: { type: String, default: "You pay the Razorpay platform fee" },
      },
      appName: { type: String, trim: true },
      appId: { type: String, trim: true },
      description: { type: String, trim: true },
      notes: { type: Schema.Types.Mixed },
      rawGatewayResponse: { type: Schema.Types.Mixed },
    },
    meta: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

PaymentSchema.methods.transitionTo = function (this: IPayment, newStatus: PaymentStatus) {
  validatePaymentTransition(this.status, newStatus, String(this._id || this.gatewayOrderId));
  this.status = newStatus;
};

PaymentSchema.pre("save", function (next) {
  if (!this.isNew && this.isModified("status")) {
    const originalStatus = (this as any)._originalStatus || this.get("status", null, { getters: false });
    // If the status has changed from its initial loaded state, validate the transition
    if ((this as any)._initStatus && (this as any)._initStatus !== this.status) {
      validatePaymentTransition((this as any)._initStatus, this.status, String(this._id || this.gatewayOrderId));
    }
  }
  next();
});

PaymentSchema.post("init", function (doc: any) {
  doc._initStatus = doc.status;
});

PaymentSchema.index({ status: 1, capturedAt: -1 });
PaymentSchema.index({ user: 1, createdAt: -1 });

export const Payment: Model<IPayment> =
  (mongoose.models.Payment as any) ||
  mongoose.model<IPayment>("Payment", PaymentSchema);
export default Payment;

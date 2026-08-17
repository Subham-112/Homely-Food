import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPaymentEvent extends Document {
  _id: mongoose.Types.ObjectId;
  eventId: string;
  eventType: string;
  payment?: mongoose.Types.ObjectId;
  gatewayOrderId?: string;
  rawPayload: Record<string, any>;
  signatureValid: boolean;
  processed: boolean;
  processingError?: string;
  receivedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentEventSchema: Schema<IPaymentEvent> = new Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    payment: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      index: true,
    },
    gatewayOrderId: {
      type: String,
      index: true,
    },
    rawPayload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    signatureValid: {
      type: Boolean,
      required: true,
      default: false,
    },
    processed: {
      type: Boolean,
      default: false,
      index: true,
    },
    processingError: {
      type: String,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const PaymentEvent: Model<IPaymentEvent> =
  (mongoose.models.PaymentEvent as any) ||
  mongoose.model<IPaymentEvent>("PaymentEvent", PaymentEventSchema);
export default PaymentEvent;

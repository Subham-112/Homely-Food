import mongoose, { Schema, Document, Model } from "mongoose";

export enum IdempotencyStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface IIdempotencyKey extends Document {
  key: string;
  path: string;
  userId?: mongoose.Types.ObjectId;
  payloadHash: string;
  status: IdempotencyStatus;
  statusCode?: number;
  responseBody?: any;
  createdAt: Date;
  expiresAt: Date;
}

const IdempotencyKeySchema: Schema<IIdempotencyKey> = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    path: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      sparse: true,
      index: true,
    },
    payloadHash: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(IdempotencyStatus),
      default: IdempotencyStatus.PENDING,
      index: true,
    },
    statusCode: {
      type: Number,
    },
    responseBody: {
      type: Schema.Types.Mixed,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // 24-hour TTL index
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

export const IdempotencyKey: Model<IIdempotencyKey> =
  (mongoose.models.IdempotencyKey as any) ||
  mongoose.model<IIdempotencyKey>("IdempotencyKey", IdempotencyKeySchema);

export default IdempotencyKey;

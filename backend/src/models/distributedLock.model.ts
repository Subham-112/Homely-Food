import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDistributedLock extends Document {
  resource: string;
  token: string;
  acquiredAt: Date;
  expiresAt: Date;
}

const DistributedLockSchema: Schema<IDistributedLock> = new Schema(
  {
    resource: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
    },
    acquiredAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index automatically removes expired locks
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

export const DistributedLock: Model<IDistributedLock> =
  (mongoose.models.DistributedLock as any) ||
  mongoose.model<IDistributedLock>("DistributedLock", DistributedLockSchema);

export default DistributedLock;

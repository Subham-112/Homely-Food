import mongoose, { Document, Schema, Model } from "mongoose";
import { UserRole, UserStatus } from "../common/enum";

export interface IAdmin extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: UserRole.ADMIN;
  permissions: string[];
  status: UserStatus;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema: Schema<IAdmin> = new Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: [UserRole.ADMIN],
      default: UserRole.ADMIN,
    },
    permissions: {
      type: [String],
      default: ["manage_menu", "manage_orders", "manage_users"],
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
    },
    refreshToken: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const Admin: Model<IAdmin> = mongoose.models.Admin || mongoose.model<IAdmin>("Admin", AdminSchema);
export default Admin;

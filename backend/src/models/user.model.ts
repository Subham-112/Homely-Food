import mongoose, { Schema } from "mongoose";
import mongooseDelete from "mongoose-delete";
import { UserRole, UserStatus } from "../common/enum";
import { ISoftDeleteDocument, ISoftDeleteModel } from "../types/softDelete";

export interface IUser extends ISoftDeleteDocument {
  _id: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  refreshToken?: string;
  welcomeRewardClaimed?: boolean;
  agreedPrivacyPolicy?: boolean;
  agreedTermsAndConditions?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
    },
    avatar: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    welcomeRewardClaimed: {
      type: Boolean,
      default: false,
    },
    agreedPrivacyPolicy: {
      type: Boolean,
      default: false,
    },
    agreedTermsAndConditions: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre("save", function (next) {
  if (typeof this.email === "string" && this.email.trim() === "") {
    this.email = undefined;
  }
  next();
});

UserSchema.plugin(mongooseDelete, { overrideMethods: "all", deletedAt: true, deletedBy: true });

export const User: ISoftDeleteModel<IUser> =
  (mongoose.models.User as any) || mongoose.model<IUser, ISoftDeleteModel<IUser>>("User", UserSchema);
export default User;

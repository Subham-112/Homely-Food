import mongoose, { Schema } from "mongoose";
import mongooseDelete from "mongoose-delete";
import { VariantStatus } from "../common/enum";
import { ISoftDeleteDocument, ISoftDeleteModel } from "../types/softDelete";

export interface IMenuItemVariant extends ISoftDeleteDocument {
  _id: mongoose.Types.ObjectId;
  menuItem: mongoose.Types.ObjectId;
  label: string;
  price: number;
  status: VariantStatus;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemVariantSchema: Schema<IMenuItemVariant> = new Schema(
  {
    menuItem: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
    },
    label: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
    },
    status: {
      type: String,
      enum: Object.values(VariantStatus),
      default: VariantStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

MenuItemVariantSchema.plugin(mongooseDelete, { overrideMethods: "all", deletedAt: true, deletedBy: true });

export const MenuItemVariant: ISoftDeleteModel<IMenuItemVariant> =
  (mongoose.models.MenuItemVariant as any) ||
  mongoose.model<IMenuItemVariant, ISoftDeleteModel<IMenuItemVariant>>(
    "MenuItemVariant",
    MenuItemVariantSchema
  );
export default MenuItemVariant;

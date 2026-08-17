import mongoose, { Schema } from "mongoose";
import mongooseDelete from "mongoose-delete";
import { MenuItemStatus } from "../common/enum";
import { ISoftDeleteDocument, ISoftDeleteModel } from "../types/softDelete";
import { IImage, ImageSchema } from "../common/image.schema";

export interface IMenuItem extends ISoftDeleteDocument {
  _id: mongoose.Types.ObjectId;
  name: string;
  category: mongoose.Types.ObjectId;
  description?: string;
  status: MenuItemStatus;
  price: number;
  preparationTime?: number;
  tags: string[];
  allergens: string[];
  image?: IImage;
  isTodaySpecial: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema: Schema<IMenuItem> = new Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(MenuItemStatus),
      default: MenuItemStatus.AVAILABLE,
    },
    price: {
      type: Number,
    },
    preparationTime: {
      type: Number,
      default: 15,
    },
    tags: {
      type: [String],
      default: [],
    },
    allergens: {
      type: [String],
      default: [],
    },
    image: {
      type: ImageSchema,
    },
    isTodaySpecial: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

MenuItemSchema.plugin(mongooseDelete, { overrideMethods: "all", deletedAt: true, deletedBy: true });

export const MenuItem: ISoftDeleteModel<IMenuItem> =
  (mongoose.models.MenuItem as any) ||
  mongoose.model<IMenuItem, ISoftDeleteModel<IMenuItem>>("MenuItem", MenuItemSchema);
export default MenuItem;

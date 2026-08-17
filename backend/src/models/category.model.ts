import mongoose, { Schema } from "mongoose";
import mongooseDelete from "mongoose-delete";
import { CategoryStatus } from "../common/enum";
import { ISoftDeleteDocument, ISoftDeleteModel } from "../types/softDelete";

export interface ICategory extends ISoftDeleteDocument {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  status: CategoryStatus;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema<ICategory> = new Schema(
  {
    name: {
      type: String,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(CategoryStatus),
      default: CategoryStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

CategorySchema.plugin(mongooseDelete, { overrideMethods: "all", deletedAt: true, deletedBy: true });

export const Category: ISoftDeleteModel<ICategory> =
  (mongoose.models.Category as any) ||
  mongoose.model<ICategory, ISoftDeleteModel<ICategory>>("Category", CategorySchema);
export default Category;

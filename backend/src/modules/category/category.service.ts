import Category from "../../models/category.model";
import MenuItem from "../../models/menuItem.model";
import ApiError from "../../utils/ApiError";
import { CategoryStatus } from "../../common/enum";

import { IImage } from "../../common/image.schema";

export class CategoryService {
  static async create(payload: { name: string; description?: string; image?: IImage | string; status?: CategoryStatus }) {
    const slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      throw new ApiError(400, `Category with name "${payload.name}" already exists.`);
    }

    const imageObj: IImage | undefined =
      typeof payload.image === "string"
        ? payload.image
          ? { url: payload.image }
          : undefined
        : payload.image;

    const category = await Category.create({
      name: payload.name,
      slug,
      description: payload.description || "",
      image: imageObj,
      status: payload.status || CategoryStatus.ACTIVE,
    });

    return category;
  }

  // Admin access: Fetch both active and inactive non-deleted categories
  static async getAllForAdmin(query: { status?: CategoryStatus }) {
    const filter: any = {};
    if (query.status) {
      filter.status = query.status;
    }
    return await Category.find(filter).sort({ createdAt: -1 });
  }

  // User access: Fetch active non-deleted categories only
  static async getActiveCategories() {
    return await Category.find({ status: CategoryStatus.ACTIVE }).sort({ createdAt: -1 });
  }

  // Fetch only id, name, and itemCount of active non-deleted categories
  static async getActiveCategoryList() {
    const categories = await Category.find({ status: CategoryStatus.ACTIVE }).select("_id name").sort({ name: 1 });

    const counts = await MenuItem.aggregate([
      { $match: { deleted: { $ne: true } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const countMap: Record<string, number> = {};
    counts.forEach((item) => {
      if (item._id) {
        countMap[item._id.toString()] = item.count;
      }
    });

    return categories.map((cat) => ({
      _id: cat._id,
      name: cat.name,
      itemCount: countMap[cat._id.toString()] || 0,
    }));
  }

  static async getById(id: string) {
    const category = await Category.findById(id);
    if (!category) {
      throw new ApiError(404, "Category not found");
    }
    return category;
  }

  static async update(id: string, payload: Partial<{ name: string; description: string; image: IImage | string; status: CategoryStatus }>) {
    const category = await Category.findById(id);
    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    if (payload.name && payload.name !== category.name) {
      const slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      const existing = await Category.findOne({ slug, _id: { $ne: id } });
      if (existing) {
        throw new ApiError(400, `Category with name "${payload.name}" already exists.`);
      }
      category.name = payload.name;
      category.slug = slug;
    }

    if (payload.description !== undefined) category.description = payload.description;
    if (payload.image !== undefined) {
      category.image = typeof payload.image === "string" ? { url: payload.image } : payload.image;
    }
    if (payload.status !== undefined) category.status = payload.status;

    await category.save();
    return category;
  }

  static async toggleStatus(id: string, status?: CategoryStatus) {
    const category = await Category.findById(id);
    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    const newStatus = status
      ? status
      : category.status === CategoryStatus.ACTIVE
      ? CategoryStatus.INACTIVE
      : CategoryStatus.ACTIVE;

    category.status = newStatus;
    await category.save();
    return category;
  }

  // Soft delete category by setting deleted: true using mongoose-delete
  static async delete(id: string, deletedBy?: string) {
    const category = await Category.findById(id);
    if (!category) {
      throw new ApiError(404, "Category not found");
    }
    await (category as any).delete(deletedBy);
    return true;
  }
}

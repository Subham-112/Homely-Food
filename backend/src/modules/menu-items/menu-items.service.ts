import MenuItem from "../../models/menuItem.model";
import Category from "../../models/category.model";
import MenuItemVariant from "../../models/menuItemVariant.model";
import ApiError from "../../utils/ApiError";
import { MenuItemStatus, VariantStatus } from "../../common/enum";
import { IImage } from "../../common/image.schema";

export interface IVariantInput {
  label: string;
  price: number;
  status?: VariantStatus;
}

export interface IMenuItemPayload {
  name: string;
  category: string;
  description?: string;
  status?: MenuItemStatus;
  price: number;
  preparationTime?: number;
  tags?: string[];
  allergens?: string[];
  image?: IImage | string;
  isTodaySpecial?: boolean;
  variants?: IVariantInput[];
}

export class MenuItemService {
  static async create(payload: IMenuItemPayload) {
    const categoryExists = await Category.findById(payload.category);
    if (!categoryExists) {
      throw new ApiError(404, "Referenced Category does not exist.");
    }

    const imageObj: IImage | undefined =
      typeof payload.image === "string"
        ? payload.image
          ? { url: payload.image }
          : undefined
        : payload.image;

    const menuItem = await MenuItem.create({
      name: payload.name,
      category: payload.category,
      description: payload.description || "",
      status: payload.status || MenuItemStatus.AVAILABLE,
      price: payload.price,
      preparationTime: payload.preparationTime || 15,
      tags: payload.tags || [],
      allergens: payload.allergens || [],
      image: imageObj,
      isTodaySpecial: payload.isTodaySpecial || false,
    });

    let createdVariants: any[] = [];
    if (payload.variants && Array.isArray(payload.variants) && payload.variants.length > 0) {
      createdVariants = await Promise.all(
        payload.variants.map((v) =>
          MenuItemVariant.create({
            menuItem: menuItem._id,
            label: v.label,
            price: v.price,
            status: v.status || VariantStatus.ACTIVE,
          })
        )
      );
    }

    return {
      ...menuItem.toObject(),
      variants: createdVariants,
    };
  }

  static async getAll(query: {
    category?: string;
    status?: MenuItemStatus;
    isTodaySpecial?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const filter: any = {};
    if (query.category) filter.category = query.category;
    if (query.status) filter.status = query.status;
    if (query.isTodaySpecial !== undefined) filter.isTodaySpecial = query.isTodaySpecial;
    if (query.search && query.search.trim()) {
      filter.name = { $regex: query.search.trim(), $options: "i" };
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, query.limit || 10);
    const skip = (page - 1) * limit;

    const total = await MenuItem.countDocuments(filter);
    const items = await MenuItem.find(filter)
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  static async getById(id: string) {
    const menuItem = await MenuItem.findById(id).populate("category", "name slug");
    if (!menuItem) {
      throw new ApiError(404, "Menu item not found");
    }

    const variants = await MenuItemVariant.find({ menuItem: id, status: "active" });

    return {
      ...menuItem.toObject(),
      variants,
    };
  }

  static async update(id: string, payload: Partial<IMenuItemPayload>) {
    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      throw new ApiError(404, "Menu item not found");
    }

    if (payload.category) {
      const categoryExists = await Category.findById(payload.category);
      if (!categoryExists) {
        throw new ApiError(404, "Referenced Category does not exist.");
      }
      menuItem.category = payload.category as any;
    }

    if (payload.name !== undefined) menuItem.name = payload.name;
    if (payload.description !== undefined) menuItem.description = payload.description;
    if (payload.status !== undefined) menuItem.status = payload.status;
    if (payload.price !== undefined) menuItem.price = payload.price;
    if (payload.preparationTime !== undefined) menuItem.preparationTime = payload.preparationTime;
    if (payload.tags !== undefined) menuItem.tags = payload.tags;
    if (payload.allergens !== undefined) menuItem.allergens = payload.allergens;
    if (payload.image !== undefined) {
      (menuItem as any).image =
        typeof payload.image === "string" ? (payload.image ? { url: payload.image } : undefined) : payload.image;
    }
    if (payload.isTodaySpecial !== undefined) menuItem.isTodaySpecial = payload.isTodaySpecial;

    await menuItem.save();
    return menuItem;
  }

  static async toggleStatus(id: string, status?: MenuItemStatus) {
    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      throw new ApiError(404, "Menu item not found");
    }

    const newStatus = status
      ? status
      : menuItem.status === MenuItemStatus.AVAILABLE
      ? MenuItemStatus.UNAVAILABLE
      : MenuItemStatus.AVAILABLE;

    menuItem.status = newStatus;
    await menuItem.save();
    return menuItem;
  }

  static async delete(id: string, deletedBy?: string) {
    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      throw new ApiError(404, "Menu item not found");
    }
    await (menuItem as any).delete(deletedBy);
    return true;
  }
}

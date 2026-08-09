import MenuItemVariant from "../../modals/menuItemVariant.model";
import MenuItem from "../../modals/menuItem.model";
import ApiError from "../../utils/ApiError";
import { VariantStatus } from "../../common/enum";

export interface IVariantPayload {
  menuItem: string;
  label: string;
  price: number;
  status?: VariantStatus;
}

export class VariantService {
  static async create(payload: IVariantPayload) {
    const menuItemExists = await MenuItem.findById(payload.menuItem);
    if (!menuItemExists) {
      throw new ApiError(404, "Referenced MenuItem does not exist.");
    }

    const variant = await MenuItemVariant.create({
      menuItem: payload.menuItem,
      label: payload.label,
      price: payload.price,
      status: payload.status || VariantStatus.ACTIVE,
    });

    return variant;
  }

  static async getByMenuItem(menuItemId: string) {
    return await MenuItemVariant.find({ menuItem: menuItemId }).sort({ createdAt: -1 });
  }

  static async getById(id: string) {
    const variant = await MenuItemVariant.findById(id).populate("menuItem", "name price");
    if (!variant) {
      throw new ApiError(404, "Variant not found");
    }
    return variant;
  }

  static async update(id: string, payload: Partial<IVariantPayload>) {
    const variant = await MenuItemVariant.findById(id);
    if (!variant) {
      throw new ApiError(404, "Variant not found");
    }

    if (payload.menuItem) {
      const menuItemExists = await MenuItem.findById(payload.menuItem);
      if (!menuItemExists) {
        throw new ApiError(404, "Referenced MenuItem does not exist.");
      }
      variant.menuItem = payload.menuItem as any;
    }

    if (payload.label !== undefined) variant.label = payload.label;
    if (payload.price !== undefined) variant.price = payload.price;
    if (payload.status !== undefined) variant.status = payload.status;

    await variant.save();
    return variant;
  }

  static async toggleStatus(id: string, status?: VariantStatus) {
    const variant = await MenuItemVariant.findById(id);
    if (!variant) {
      throw new ApiError(404, "Variant not found");
    }

    const newStatus = status
      ? status
      : variant.status === VariantStatus.ACTIVE
      ? VariantStatus.INACTIVE
      : VariantStatus.ACTIVE;

    variant.status = newStatus;
    await variant.save();
    return variant;
  }

  static async delete(id: string, deletedBy?: string) {
    const variant = await MenuItemVariant.findById(id);
    if (!variant) {
      throw new ApiError(404, "Variant not found");
    }
    await (variant as any).delete(deletedBy);
    return true;
  }
}

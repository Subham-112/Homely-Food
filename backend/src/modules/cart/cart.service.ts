import Cart from "../../models/cart.model";
import MenuItem from "../../models/menuItem.model";
import MenuItemVariant from "../../models/menuItemVariant.model";
import ApiError from "../../utils/ApiError";

export interface ISyncCartItemInput {
  menuItem: string;
  quantity: number;
  variant?: string;
}

export class CartService {
  static async getCart(userId: string) {
    let cart = await Cart.findOne({ user: userId })
      .populate({
        path: "items.menuItem",
        select: "_id name price image status category",
      })
      .populate({
        path: "items.variant",
        select: "_id label price status",
      });

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    return cart;
  }

  static async syncCart(userId: string, items: ISyncCartItemInput[]) {
    // Validate that all menuItems exist and are available
    if (items && items.length > 0) {
      await Promise.all(
        items.map(async (item) => {
          const menuItem = await MenuItem.findById(item.menuItem);
          if (!menuItem) {
            throw new ApiError(404, `Menu item with ID "${item.menuItem}" not found.`);
          }
          if (item.variant) {
            const variant = await MenuItemVariant.findById(item.variant);
            if (!variant) {
              throw new ApiError(404, `Variant with ID "${item.variant}" not found.`);
            }
          }
        })
      );
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({
        user: userId,
        items: items.map((item) => ({
          menuItem: item.menuItem as any,
          quantity: item.quantity,
          variant: item.variant as any,
        })),
      });
    } else {
      cart.items = items.map((item) => ({
        menuItem: item.menuItem as any,
        quantity: item.quantity,
        variant: item.variant as any,
      })) as any;
      await cart.save();
    }

    return this.getCart(userId);
  }

  static async clearCart(userId: string) {
    let cart = await Cart.findOne({ user: userId });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    return cart;
  }
}

import Cart, { ICart } from "../../models/cart.model";
import MenuItem from "../../models/menuItem.model";
import MenuItemVariant from "../../models/menuItemVariant.model";
import Offer from "../../models/offer.model";
import Order from "../../models/order.model";
import { Customer } from "../../models/customer.model";
import User from "../../models/user.model";
import ApiError from "../../utils/ApiError";
import { CartStatus, OfferType, OrderFor, OrderStatus, OrderType, PaymentMethod, PaymentStatus } from "../../common/enum";
import { emitNewOrder } from "../../socket/socketService";
import { OrderService } from "../order/order.service";

export interface ISyncCartItemInput {
  menuItem: string;
  quantity: number;
  variant?: string;
}

export interface ICheckoutInput {
  cartId?: string;
  orderType?: OrderType;
  deliveryAddress?: string;
  pickupTiming?: string;
  notes?: string;
  paymentMethod?: PaymentMethod;
  paymentPreference?: "CASH" | "ONLINE";
  guest?: {
    name: string;
    phone: string;
    email?: string;
  };
}

export class CartService {
  /**
   * Helper: Calculate SubTotal, Discount, and TotalAmount for a cart document
   */
  private static async recalculateCartTotals(cart: ICart): Promise<ICart> {
    if (!cart.items || cart.items.length === 0) {
      cart.total = {
        subTotal: 0,
        discount: 0,
        totalAmount: 0,
        offer: undefined,
        offerCode: undefined,
      };
      return cart;
    }

    let subTotal = 0;

    // Calculate subTotal using live menu item & variant prices
    for (const item of cart.items) {
      const menuItemDoc = await MenuItem.findById(item.menuItem);
      if (!menuItemDoc) continue;

      let itemUnitPrice = menuItemDoc.price;
      if (item.variant) {
        const variantDoc = await MenuItemVariant.findById(item.variant);
        if (variantDoc && variantDoc.price) {
          itemUnitPrice = variantDoc.price;
        }
      }

      subTotal += itemUnitPrice * item.quantity;
    }

    let discount = 0;
    let appliedOfferDoc: any = null;

    // Re-verify attached offer/coupon if present
    if (cart.total?.offerCode || cart.total?.offer) {
      const query: any = cart.total.offerCode
        ? { code: cart.total.offerCode.trim().toUpperCase() }
        : { _id: cart.total.offer };

      appliedOfferDoc = await Offer.findOne(query);

      const now = new Date();
      const isValid =
        appliedOfferDoc &&
        appliedOfferDoc.isActive &&
        new Date(appliedOfferDoc.startDate) <= now &&
        new Date(appliedOfferDoc.endDate) >= now &&
        subTotal >= (appliedOfferDoc.minCartValue || 0);

      if (!isValid) {
        // Offer is no longer valid for this cart total
        appliedOfferDoc = null;
        discount = 0;
      } else {
        // Compute discount based on offerType
        if (appliedOfferDoc.offerType === OfferType.PERCENTAGE) {
          discount = Math.round((subTotal * (appliedOfferDoc.discountPercentage || 0)) / 100);
          if (appliedOfferDoc.maxDiscountAmount && discount > appliedOfferDoc.maxDiscountAmount) {
            discount = appliedOfferDoc.maxDiscountAmount;
          }
        } else if (appliedOfferDoc.offerType === OfferType.FLAT) {
          discount = appliedOfferDoc.flatDiscountAmount || 0;
        } else if (appliedOfferDoc.offerType === OfferType.BOGO) {
          // BOGO calculation: check if buyItem and freeItem match
          if (appliedOfferDoc.buyItem && appliedOfferDoc.freeItem) {
            const buyCartItem = cart.items.find(
              (i) => i.menuItem.toString() === appliedOfferDoc.buyItem.toString()
            );
            const freeCartItem = cart.items.find(
              (i) => i.menuItem.toString() === appliedOfferDoc.freeItem.toString()
            );

            if (buyCartItem && buyCartItem.quantity >= (appliedOfferDoc.buyQuantity || 1) && freeCartItem) {
              const freeDoc = await MenuItem.findById(appliedOfferDoc.freeItem);
              if (freeDoc) {
                discount = freeDoc.price * (appliedOfferDoc.freeQuantity || 1);
              }
            }
          }
        }
      }
    }

    // Ensure discount never exceeds subTotal
    discount = Math.min(subTotal, Math.max(0, discount));
    const totalAmount = Math.max(0, subTotal - discount);

    cart.total = {
      subTotal,
      discount,
      totalAmount,
      offer: appliedOfferDoc ? appliedOfferDoc._id : undefined,
      offerCode: appliedOfferDoc ? appliedOfferDoc.code : undefined,
    };

    return cart;
  }

  static async getCart(userId: string) {
    let cart = await Cart.findOne({ user: userId, status: "active" })
      .populate({
        path: "items.menuItem",
        select: "_id name price image status category",
      })
      .populate({
        path: "items.variant",
        select: "_id label price status",
      })
      .populate({
        path: "total.offer",
        select: "_id title code offerType discountPercentage flatDiscountAmount maxDiscountAmount minCartValue",
      });

    if (!cart) {
      return null;
    }

    return cart;
  }

  static async syncCart(userId: string, items: ISyncCartItemInput[]) {
    // If items array is empty, delete the active cart permanently
    if (!items || items.length === 0) {
      const existingCart = await Cart.findOne({ user: userId, status: "active" });
      if (existingCart) {
        await existingCart.deleteOne();
      }
      return null;
    }

    // Validate that all menuItems exist and are active
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

    let cart = await Cart.findOne({ user: userId, status: "active" });

    if (!cart) {
      cart = new Cart({
        user: userId,
        status: "active",
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
    }

    // Recalculate subTotal, discount, totalAmount and update total key
    await this.recalculateCartTotals(cart);
    await cart.save();

    return this.getCart(userId);
  }

  static async applyOffer(userId: string, offerCode: string) {
    if (!offerCode || !offerCode.trim()) {
      throw new ApiError(400, "Please provide a valid coupon code.");
    }

    const cart = await Cart.findOne({ user: userId, status: "active" });
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new ApiError(400, "Cannot apply coupon to an empty cart.");
    }

    const cleanCode = offerCode.trim().toUpperCase();
    const offer = await Offer.findOne({ code: cleanCode, isActive: true });

    if (!offer) {
      throw new ApiError(400, `Coupon code "${cleanCode}" is invalid or inactive.`);
    }

    const now = new Date();
    if (new Date(offer.startDate) > now || new Date(offer.endDate) < now) {
      throw new ApiError(400, `Coupon code "${cleanCode}" has expired.`);
    }

    cart.total.offerCode = cleanCode;
    cart.total.offer = offer._id as any;

    await this.recalculateCartTotals(cart);

    if (cart.total.discount <= 0 && offer.minCartValue) {
      cart.total.offerCode = undefined;
      cart.total.offer = undefined;
      await cart.save();
      throw new ApiError(
        400,
        `Minimum cart value of ₹${offer.minCartValue} required for coupon "${cleanCode}".`
      );
    }

    await cart.save();
    return this.getCart(userId);
  }

  static async removeOffer(userId: string) {
    const cart = await Cart.findOne({ user: userId, status: "active" });
    if (cart) {
      cart.total.offer = undefined;
      cart.total.offerCode = undefined;
      cart.total.discount = 0;
      await this.recalculateCartTotals(cart);
      await cart.save();
    }
    return this.getCart(userId);
  }

  static async clearCart(userId: string) {
    const cart = await Cart.findOne({ user: userId, status: "active" });
    if (cart) {
      await cart.deleteOne();
    }
    return null;
  }

  static async checkout(userId: string, payload: ICheckoutInput) {
    let cart = await Cart.findOne({
      $or: [
        { _id: payload.cartId, status: "active" },
        { user: userId, status: "active" },
      ],
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new ApiError(404, "Active cart not found or cart is empty.");
    }

    // Recalculate totals dynamically before creating order
    await this.recalculateCartTotals(cart);

    // Build order items
    const orderItems = cart.items.map((item) => ({
      menuItem: item.menuItem.toString(),
      quantity: item.quantity,
      variant: item.variant ? { variantId: item.variant.toString() } : undefined,
    }));

    // User details lookup
    const userDoc = await User.findById(userId);
    const guestData = payload.guest || {
      name: userDoc?.name || "Customer",
      phone: userDoc?.phone || "",
      email: userDoc?.email || "",
    };

    const orderPayload = {
      userId,
      guest: guestData,
      items: orderItems,
      discount: cart.total?.discount || 0,
      orderType: payload.orderType || OrderType.DINE_IN,
      deliveryAddress: payload.deliveryAddress,
      pickupTiming: payload.pickupTiming,
      notes: payload.notes || "",
      paymentPreference: payload.paymentPreference || "CASH",
      createdBy: "customer",
    };

    if (payload.paymentPreference === "ONLINE") {
      const { PaymentService } = await import("../payment/payment.service");
      return await PaymentService.createPendingCheckout(orderPayload, userId);
    }

    const order = await OrderService.create(orderPayload);

    // Mark cart as completed for CASH order
    cart.status = CartStatus.COMPLETED;
    await cart.save();

    return order;
  }
}

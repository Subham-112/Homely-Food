import Cart, { ICart } from "../../models/cart.model";
import MenuItem from "../../models/menuItem.model";
import MenuItemVariant from "../../models/menuItemVariant.model";
import Offer from "../../models/offer.model";
import Order from "../../models/order.model";
import { Customer } from "../../models/customer.model";
import User from "../../models/user.model";
import ApiError from "../../utils/ApiError";
import { CartStatus, MenuItemStatus, OfferType, OrderFor, OrderStatus, OrderType, PaymentMethod, PaymentStatus, VariantStatus } from "../../common/enum";
import { emitNewOrder } from "../../socket/socketService";
import { OrderService } from "../order/order.service";

export interface ISyncCartItemInput {
  menuItem: string;
  quantity: number;
  variant?: string;
  isReorder?: boolean;
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
  checkoutScope?: "all" | "cart_only" | "reorder_only";
  keepRemaining?: boolean;
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

    // Check if coins are applied vs offer coupon
    if (cart.total?.discountType === "coins" && cart.total?.coinsUsed) {
      discount = cart.total.coinsUsed;
    } else if (cart.total?.offerCode || cart.total?.offer) {
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
      discountType: cart.total?.discountType === "coins" ? "coins" : appliedOfferDoc ? "offer" : undefined,
      coinsUsed: cart.total?.discountType === "coins" ? discount : 0,
      coinStatus: cart.total?.discountType === "coins" ? (cart.total.coinStatus || "applied") : "none",
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
          isReorder: Boolean(item.isReorder),
        })),
      });
    } else {
      cart.items = items.map((item) => ({
        menuItem: item.menuItem as any,
        quantity: item.quantity,
        variant: item.variant as any,
        isReorder: Boolean(item.isReorder),
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

    // Clear coins if coupon applied
    cart.total.discountType = "offer";
    cart.total.coinsUsed = 0;
    cart.total.coinStatus = "none";
    cart.total.offerCode = cleanCode;
    cart.total.offer = offer._id as any;

    await this.recalculateCartTotals(cart);

    if (cart.total.discount <= 0 && offer.minCartValue) {
      cart.total.offerCode = undefined;
      cart.total.offer = undefined;
      cart.total.discountType = undefined;
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
      cart.total.discountType = undefined;
      cart.total.discount = 0;
      await this.recalculateCartTotals(cart);
      await cart.save();
    }
    return this.getCart(userId);
  }

  /**
   * Calculate exact deductible coins based on order amount and redemption rules
   */
  static async calculateCoinDeduction(userId: string, cartId?: string) {
    const { CoinService } = await import("../coin/coin.service");
    const { CoinRedemptionRuleService } = await import("../coin/coinRedemptionRule.service");
    await CoinRedemptionRuleService.seedDefaultRules();

    const wallet = await CoinService.getOrCreateWallet(userId);

    const query = cartId ? { _id: cartId, user: userId } : { user: userId, status: "active" };
    const cart = await Cart.findOne(query);

    if (!cart || !cart.items || cart.items.length === 0) {
      return {
        userBalance: wallet.balance,
        maxDeductible: 0,
        deductedCoins: 0,
        discountAmount: 0,
      };
    }

    await this.recalculateCartTotals(cart);

    const cartTotalAmount = cart.total.subTotal || 0;
    const matchingRule = await CoinRedemptionRuleService.resolveRedemptionRule(cartTotalAmount);

    if (!matchingRule) {
      const minThreshold = await CoinRedemptionRuleService.getMinThreshold();
      return {
        userBalance: wallet.balance,
        maxDeductible: 0,
        deductedCoins: 0,
        discountAmount: 0,
        minOrderRequired: minThreshold || 0,
      };
    }

    const maxAllowedCoins = matchingRule.maxCoinsDeductible;
    const deductedCoins = Math.min(wallet.balance, maxAllowedCoins, cartTotalAmount);

    return {
      userBalance: wallet.balance,
      maxDeductible: maxAllowedCoins,
      deductedCoins,
      discountAmount: deductedCoins,
      minOrderRequired: matchingRule.minOrderAmount,
    };
  }

  /**
   * Attach/Apply coins discount to cart (set coinStatus to 'applied')
   * Deducts coins according to qualifying redemption rule
   */
  static async applyCoins(userId: string, cartId?: string) {
    const query = cartId ? { _id: cartId, user: userId } : { user: userId, status: "active" };
    const cart = await Cart.findOne(query);

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new ApiError(404, "Active cart not found or cart is empty.");
    }

    const { CoinService } = await import("../coin/coin.service");
    const { CoinRedemptionRuleService } = await import("../coin/coinRedemptionRule.service");
    await CoinRedemptionRuleService.seedDefaultRules();

    const wallet = await CoinService.getOrCreateWallet(userId);

    if (!wallet || wallet.balance <= 0) {
      throw new ApiError(400, "You don't have any Homely Coins in your wallet to apply for a discount.");
    }

    await this.recalculateCartTotals(cart);

    const cartTotalAmount = cart.total.subTotal || 0;
    if (cartTotalAmount <= 0) {
      throw new ApiError(400, "Your cart total must be greater than ₹0 to redeem Homely Coins.");
    }

    const matchingRule = await CoinRedemptionRuleService.resolveRedemptionRule(cartTotalAmount);
    if (!matchingRule) {
      const minThreshold = await CoinRedemptionRuleService.getMinThreshold();
      if (minThreshold && cartTotalAmount < minThreshold) {
        throw new ApiError(
          400,
          `Minimum cart value of ₹${minThreshold} is required to redeem Homely Coins.`
        );
      }
      throw new ApiError(400, "No active coin redemption tier applies to this order amount.");
    }

    const maxAllowedCoins = matchingRule.maxCoinsDeductible;
    const coinsToDeduct = Math.min(wallet.balance, maxAllowedCoins, cartTotalAmount);

    if (coinsToDeduct <= 0) {
      throw new ApiError(400, "You don't have enough coins to use as discount.");
    }

    // Mutually exclusive: Clear attached offer coupon
    cart.total.offer = undefined;
    cart.total.offerCode = undefined;

    cart.total.discountType = "coins";
    cart.total.coinsUsed = coinsToDeduct;
    cart.total.coinStatus = "applied";
    cart.total.discount = coinsToDeduct;
    cart.total.totalAmount = Math.max(0, cartTotalAmount - coinsToDeduct);

    await cart.save();
    return this.getCart(userId);
  }

  /**
   * Remove applied coins discount from cart
   */
  static async removeCoins(userId: string, cartId?: string) {
    const query = cartId ? { _id: cartId, user: userId } : { user: userId, status: "active" };
    const cart = await Cart.findOne(query);

    if (cart) {
      cart.total.discountType = undefined;
      cart.total.coinsUsed = 0;
      cart.total.coinStatus = "none";
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

    // Filter items based on checkoutScope ("all" | "cart_only" | "reorder_only")
    const scope = payload.checkoutScope || "all";
    let activeCheckoutItems = cart.items;
    let remainingCartItems: typeof cart.items = [];

    if (scope === "cart_only") {
      activeCheckoutItems = cart.items.filter((i) => !i.isReorder);
      remainingCartItems = cart.items.filter((i) => Boolean(i.isReorder));
    } else if (scope === "reorder_only") {
      activeCheckoutItems = cart.items.filter((i) => Boolean(i.isReorder));
      remainingCartItems = cart.items.filter((i) => !i.isReorder);
    }

    if (activeCheckoutItems.length === 0) {
      throw new ApiError(400, "No items match the selected checkout scope.");
    }

    // Create a temporary cart object to recalculate order totals for selected scope
    const rawTotal = cart.total && typeof (cart.total as any).toObject === "function"
      ? (cart.total as any).toObject()
      : cart.total && (cart.total as any)._doc
      ? (cart.total as any)._doc
      : { ...cart.total };

    const tempCart: any = {
      items: activeCheckoutItems,
      total: {
        subTotal: rawTotal?.subTotal || 0,
        discount: rawTotal?.discount || 0,
        totalAmount: rawTotal?.totalAmount || 0,
        offer: rawTotal?.offer,
        offerCode: rawTotal?.offerCode,
        discountType: rawTotal?.discountType,
        coinsUsed: rawTotal?.coinsUsed,
        coinStatus: rawTotal?.coinStatus,
      },
    };
    await this.recalculateCartTotals(tempCart as any);

    // Build order items
    const orderItems = activeCheckoutItems.map((item) => ({
      menuItem: item.menuItem.toString(),
      quantity: item.quantity,
      variant: item.variant ? { variantId: item.variant.toString() } : undefined,
    }));

    // User details lookup
    const userDoc = await User.findById(userId);
    const guestEmail = payload.guest?.email || userDoc?.email;
    const guestData: { name: string; phone: string; email?: string } = {
      name: payload.guest?.name || userDoc?.name || "Customer",
      phone: payload.guest?.phone || userDoc?.phone || "",
      ...(guestEmail && guestEmail.trim() ? { email: guestEmail.trim() } : {}),
    };

    // Generate Order Number
    const orderNumber = `ORD-${Math.floor(100000000 + Math.random() * 900000000)}`;

    const orderPayload = {
      orderNumber,
      user: userId,
      orderFor: OrderFor.REGISTERED_USER,
      guest: guestData,
      items: orderItems,
      payment: {
        method: payload.paymentMethod,
        status: PaymentStatus.UNPAID,
        amount: tempCart.total.totalAmount,
        discountType: tempCart.total.discountType,
        coinsUsed: tempCart.total.coinsUsed,
      },
      status: OrderStatus.ACCEPTED,
      orderType: payload.orderType || OrderType.DINE_IN,
      deliveryAddress: payload.deliveryAddress,
      pickupTiming: payload.pickupTiming,
      subTotal: tempCart.total.subTotal,
      discount: tempCart.total.discount,
      totalAmount: tempCart.total.totalAmount,
      discountType: tempCart.total.discountType,
      coinsUsed: tempCart.total.coinsUsed,
      offer: tempCart.total.offer,
      offerCode: tempCart.total.offerCode,
      notes: payload.notes,
      createdBy: "customer",
    };

    // Handle cart cleanup vs retention of remaining items BEFORE payment branching
    if (payload.keepRemaining && remainingCartItems.length > 0) {
      // Keep un-ordered items in active cart
      cart.items = remainingCartItems;
      await this.recalculateCartTotals(cart);
      await cart.save();
    } else if (payload.paymentPreference !== "ONLINE") {
      // Mark full cart as completed for CASH order
      cart.status = CartStatus.COMPLETED;
      await cart.save();
    }

    if (payload.paymentPreference === "ONLINE") {
      const { PaymentService } = await import("../payment/payment.service");
      return await PaymentService.createPendingCheckout(
        {
          ...orderPayload,
          keepRemaining: payload.keepRemaining,
          remainingItemCount: remainingCartItems.length,
        } as any,
        userId
      );
    }

    const order = await OrderService.create(orderPayload);

    // If coins were used, update cart coinStatus to 'converted' & debit user's wallet
    if (tempCart.total.discountType === "coins" && tempCart.total.coinsUsed && tempCart.total.coinsUsed > 0) {
      cart.total.coinStatus = "converted";
      try {
        const { CoinService } = await import("../coin/coin.service");
        const { CoinTransactionType } = await import("../../common/enum");
        await CoinService.debitWallet(userId, tempCart.total.coinsUsed, {
          type: CoinTransactionType.SPENT,
          reason: "Applied for Discount",
          orderId: order._id.toString(),
        });
      } catch (err) {
        console.error("Failed to debit wallet for coins redeemed on order:", err);
      }
    }

    return order;
  }

  /**
   * Reorder items from a previous order into user's cart
   */
  static async reorderCart(userId: string, orderId: string): Promise<ICart> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError(404, "Original order not found.");
    }

    if (order.user && order.user.toString() !== userId.toString()) {
      throw new ApiError(403, "Forbidden: You can only reorder your own past orders.");
    }

    if (!order.items || order.items.length === 0) {
      throw new ApiError(400, "Original order has no items to reorder.");
    }

    // Find active menu items from the order that are still available
    const reorderItems: ISyncCartItemInput[] = [];

    for (const item of order.items) {
      const menuItemId = (item.menuItem as any)?._id?.toString() || item.menuItem?.toString();
      if (!menuItemId) continue;

      const menuItemDoc = await MenuItem.findById(menuItemId);
      if (!menuItemDoc || menuItemDoc.status !== MenuItemStatus.AVAILABLE) continue;

      let variantId: string | undefined = undefined;
      if (item.variant) {
        let rawVId: any = undefined;
        if (typeof item.variant === "object" && item.variant !== null) {
          rawVId = item.variant.variantId || (item.variant as any)._id;
        } else if (typeof item.variant === "string") {
          rawVId = item.variant;
        }

        const vIdStr = rawVId ? String(rawVId) : undefined;
        if (vIdStr && vIdStr !== "[object Object]" && vIdStr !== "{}") {
          const variantDoc = await MenuItemVariant.findById(vIdStr);
          if (variantDoc && variantDoc.status === VariantStatus.ACTIVE) {
            variantId = vIdStr;
          }
        }
      }

      reorderItems.push({
        menuItem: menuItemId,
        quantity: item.quantity || 1,
        variant: variantId,
      });
    }

    if (reorderItems.length === 0) {
      throw new ApiError(400, "None of the items from this order are currently available for reorder.");
    }

    // Merge with existing cart items instead of overwriting
    const existingCart = await Cart.findOne({ user: userId, status: "active" });
    const mergedMap = new Map<string, ISyncCartItemInput>();

    // 1. Add existing cart items into map (preserve their isReorder status)
    if (existingCart && existingCart.items) {
      for (const item of existingCart.items) {
        const mId = item.menuItem.toString();
        const vId = item.variant ? item.variant.toString() : "";
        const key = `${mId}_${vId}`;
        mergedMap.set(key, {
          menuItem: mId,
          quantity: item.quantity,
          variant: vId || undefined,
          isReorder: Boolean(item.isReorder),
        });
      }
    }

    // 2. Append/merge re-ordered items with isReorder: true
    for (const rItem of reorderItems) {
      const key = `${rItem.menuItem}_${rItem.variant || ""}`;
      const existing = mergedMap.get(key);
      if (existing) {
        existing.quantity += rItem.quantity;
        // Keep as reorder item if it was re-ordered
        existing.isReorder = true;
      } else {
        mergedMap.set(key, {
          ...rItem,
          isReorder: true,
        });
      }
    }

    const finalMergedItems = Array.from(mergedMap.values());

    // Sync user's cart with combined merged items
    const updatedCart = await this.syncCart(userId, finalMergedItems);
    if (!updatedCart) {
      throw new ApiError(500, "Failed to update cart during reorder.");
    }

    return updatedCart;
  }
}

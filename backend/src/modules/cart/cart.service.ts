import Cart, { ICart, ICoinRemovalNotice } from "../../models/cart.model";
import MenuItem from "../../models/menuItem.model";
import MenuItemVariant from "../../models/menuItemVariant.model";
import Offer from "../../models/offer.model";
import Order from "../../models/order.model";
import User from "../../models/user.model";
import ApiError from "../../utils/ApiError";
import { CartStatus, MenuItemStatus, OfferType, OrderFor, OrderStatus, OrderType, PaymentMethod, PaymentStatus, VariantStatus } from "../../common/enum";
import { OrderService } from "../order/order.service";
import { CoinRedemptionRuleService } from "../coin/coinRedemptionRule.service";

import ShopDetails from "../../models/shopDetails.model";
import { calculateItemPricing } from "../../utils/pricing";

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
        discountType: undefined,
        coinsUsed: 0,
        coinStatus: "none",
        coinRemovalNotice: undefined,
      };
      return cart;
    }

    // Extract all unique menuItemIds and variantIds for batch retrieval (optimized O(1) DB roundtrips)
    const menuItemIds: string[] = [];
    const variantIds: string[] = [];

    for (const item of cart.items) {
      const mId =
        typeof item.menuItem === "object" && (item.menuItem as any)?._id
          ? (item.menuItem as any)._id.toString()
          : item.menuItem?.toString();
      if (mId && !menuItemIds.includes(mId)) {
        menuItemIds.push(mId);
      }

      const vId =
        typeof item.variant === "object" && (item.variant as any)?._id
          ? (item.variant as any)._id.toString()
          : item.variant?.toString();
      if (vId && !variantIds.includes(vId)) {
        variantIds.push(vId);
      }
    }

    const [shopDetails, menuItemsDocs, variantsDocs, allRules] = await Promise.all([
      ShopDetails.findOne(),
      MenuItem.find({ _id: { $in: menuItemIds } }),
      variantIds.length > 0 ? MenuItemVariant.find({ _id: { $in: variantIds } }) : [],
      CoinRedemptionRuleService.getAllRules(false),
    ]);

    const menuItemMap = new Map<string, any>();
    menuItemsDocs.forEach((doc) => menuItemMap.set(doc._id.toString(), doc));

    const variantMap = new Map<string, any>();
    variantsDocs.forEach((doc) => variantMap.set(doc._id.toString(), doc));

    let subTotal = 0;

    // Calculate subTotal in-memory
    for (const item of cart.items) {
      const mId =
        typeof item.menuItem === "object" && (item.menuItem as any)?._id
          ? (item.menuItem as any)._id.toString()
          : item.menuItem?.toString();
      const menuItemDoc = mId ? menuItemMap.get(mId) : null;
      if (!menuItemDoc) continue;

      let basePrice = menuItemDoc.price;
      const vId =
        typeof item.variant === "object" && (item.variant as any)?._id
          ? (item.variant as any)._id.toString()
          : item.variant?.toString();

      if (vId) {
        const variantDoc = variantMap.get(vId);
        if (variantDoc && variantDoc.price) {
          basePrice = variantDoc.price;
        }
      }

      const pricing = calculateItemPricing(basePrice, menuItemDoc.discountPercent, shopDetails);
      subTotal += pricing.discountedPrice * item.quantity;
    }

    let discount = 0;
    let appliedOfferDoc: any = null;
    let coinRemovalNotice: ICoinRemovalNotice | undefined = undefined;

    // 1. Re-validate Coin Discount if coins were previously applied
    if (cart.total?.discountType === "coins" && cart.total?.coinsUsed && cart.total.coinsUsed > 0) {
      const previouslyAppliedCoins = cart.total.coinsUsed;
      const sortedRules = [...(allRules || [])].sort((a, b) => a.minOrderAmount - b.minOrderAmount);
      const qualifyingRules = sortedRules.filter((r) => subTotal >= r.minOrderAmount);
      const currentRule = qualifyingRules.length > 0 ? qualifyingRules[qualifyingRules.length - 1] : null;

      const maxAllowedCoins = currentRule ? currentRule.maxCoinsDeductible : 0;

      // Invalidate coins if: no tier matches (below min threshold) OR coinsUsed > max allowed for this tier OR coinsUsed > subTotal
      if (!currentRule || previouslyAppliedCoins > maxAllowedCoins || previouslyAppliedCoins > subTotal) {
        discount = 0;
        cart.total.discountType = undefined;
        cart.total.coinsUsed = 0;
        cart.total.coinStatus = "none";

        const minRequiredRule = sortedRules.find((r) => r.maxCoinsDeductible >= previouslyAppliedCoins);
        const minOrderAmountReq = minRequiredRule ? minRequiredRule.minOrderAmount : (currentRule?.minOrderAmount || 0);

        const reason = maxAllowedCoins > 0
          ? `Homely Coins discount (${previouslyAppliedCoins} coins) was removed because cart value dropped below ₹${minOrderAmountReq}. You can now use up to ${maxAllowedCoins} coins for ₹${subTotal} order value.`
          : `Homely Coins discount (${previouslyAppliedCoins} coins) was removed because cart value of ₹${subTotal} is below the minimum required ₹${sortedRules[0]?.minOrderAmount || 100}.`;

        coinRemovalNotice = {
          removed: true,
          reason,
          previousCoins: previouslyAppliedCoins,
          maxEligibleCoins: maxAllowedCoins,
          currentSubTotal: subTotal,
        };
      } else {
        // Coins remain valid
        discount = previouslyAppliedCoins;
        cart.total.discountType = "coins";
        cart.total.coinsUsed = previouslyAppliedCoins;
        cart.total.coinStatus = "applied";
      }
    } else if (cart.total?.offerCode || cart.total?.offer) {
      // 2. Re-validate Coupon Offer
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
        appliedOfferDoc = null;
        discount = 0;
      } else {
        if (appliedOfferDoc.offerType === OfferType.PERCENTAGE) {
          discount = Math.round((subTotal * (appliedOfferDoc.discountPercentage || 0)) / 100);
          if (appliedOfferDoc.maxDiscountAmount && discount > appliedOfferDoc.maxDiscountAmount) {
            discount = appliedOfferDoc.maxDiscountAmount;
          }
        } else if (appliedOfferDoc.offerType === OfferType.FLAT) {
          discount = appliedOfferDoc.flatDiscountAmount || 0;
        } else if (appliedOfferDoc.offerType === OfferType.BOGO) {
          if (appliedOfferDoc.buyItem && appliedOfferDoc.freeItem) {
            const buyCartItem = cart.items.find(
              (i) => i.menuItem.toString() === appliedOfferDoc.buyItem.toString()
            );
            const freeCartItem = cart.items.find(
              (i) => i.menuItem.toString() === appliedOfferDoc.freeItem.toString()
            );

            if (buyCartItem && buyCartItem.quantity >= (appliedOfferDoc.buyQuantity || 1) && freeCartItem) {
              const freeDoc = menuItemMap.get(appliedOfferDoc.freeItem.toString()) || (await MenuItem.findById(appliedOfferDoc.freeItem));
              if (freeDoc) {
                const freePricing = calculateItemPricing(freeDoc.price, freeDoc.discountPercent, shopDetails);
                discount = freePricing.discountedPrice * (appliedOfferDoc.freeQuantity || 1);
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
      coinRemovalNotice: coinRemovalNotice || undefined,
    };

    return cart;
  }

  static async getCart(userId: string, skipRecalculate = false) {
    let cart = await Cart.findOne({ user: userId, status: "active" });
    if (!cart) {
      return null;
    }

    if (!skipRecalculate) {
      await this.recalculateCartTotals(cart);
      await cart.save();
    }

    cart = await Cart.findOne({ user: userId, status: "active" })
      .populate({
        path: "items.menuItem",
        select: "_id name price discountPercent image status category",
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

    const shopDetails = await ShopDetails.findOne();
    const cartObj: any = cart.toObject();

    // Consume/Clear one-time coinRemovalNotice from database after reading it once
    if (cart.total?.coinRemovalNotice) {
      Cart.updateOne({ _id: cart._id }, { $unset: { "total.coinRemovalNotice": 1 } })
        .exec()
        .catch(() => {});
    }

    if (cartObj.items && Array.isArray(cartObj.items)) {
      cartObj.items = cartObj.items.map((cartItem: any) => {
        if (cartItem.menuItem && typeof cartItem.menuItem === "object") {
          const itemBasePrice = cartItem.variant?.price || cartItem.menuItem.price;
          const pricing = calculateItemPricing(
            itemBasePrice,
            cartItem.menuItem.discountPercent,
            shopDetails
          );
          cartItem.menuItem.price = pricing.price;
          cartItem.menuItem.discountPercent = pricing.discountPercent;
          cartItem.menuItem.discountedPrice = pricing.discountedPrice;
        }
        return cartItem;
      });
    }

    return cartObj;
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

    return this.getCart(userId, true);
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
    return this.getCart(userId, true);
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
    return this.getCart(userId, true);
  }

  /**
   * Calculate exact deductible coins based on order amount and redemption rules
   */
  static async calculateCoinDeduction(userId: string, cartId?: string) {
    const { CoinService } = await import("../coin/coin.service");
    const { CoinRedemptionRuleService } = await import("../coin/coinRedemptionRule.service");
    await CoinRedemptionRuleService.seedDefaultRules();

    const wallet = await CoinService.getOrCreateWallet(userId);
    const userBalance = wallet?.balance || 0;

    const query = cartId ? { _id: cartId, user: userId } : { user: userId, status: "active" };
    const cart = await Cart.findOne(query);

    if (!cart || !cart.items || cart.items.length === 0) {
      return {
        userBalance,
        isEligible: false,
        maxDeductible: 0,
        deductedCoins: 0,
        discountAmount: 0,
        minOrderRequired: 0,
        currentTier: null,
        nextTier: null,
        eligibleMessage: null,
        nudgeMessage: null,
        status: "empty_cart",
      };
    }

    await this.recalculateCartTotals(cart);
    const cartTotalAmount = cart.total?.subTotal || 0;

    const allRules = await CoinRedemptionRuleService.getAllRules(false);

    if (!allRules || allRules.length === 0) {
      return {
        userBalance,
        isEligible: false,
        maxDeductible: 0,
        deductedCoins: 0,
        discountAmount: 0,
        minOrderRequired: 0,
        currentTier: null,
        nextTier: null,
        eligibleMessage: null,
        nudgeMessage: null,
        status: "no_rules",
      };
    }

    // Sort rules ascending by minOrderAmount
    const sortedRules = [...allRules].sort((a, b) => a.minOrderAmount - b.minOrderAmount);

    // Find current matched rule (highest rule with minOrderAmount <= cartTotalAmount)
    const qualifyingRules = sortedRules.filter((r) => cartTotalAmount >= r.minOrderAmount);
    const currentRule = qualifyingRules.length > 0 ? qualifyingRules[qualifyingRules.length - 1] : null;

    // Find next tier rule (lowest rule with minOrderAmount > cartTotalAmount)
    const nextRule = sortedRules.find((r) => r.minOrderAmount > cartTotalAmount) || null;

    if (userBalance <= 0) {
      const nextTierInfo = nextRule
        ? {
            minOrderAmount: nextRule.minOrderAmount,
            maxCoinsDeductible: nextRule.maxCoinsDeductible,
            shortfall: Math.max(0, nextRule.minOrderAmount - cartTotalAmount),
          }
        : null;

      return {
        userBalance: 0,
        isEligible: false,
        maxDeductible: currentRule?.maxCoinsDeductible || 0,
        deductedCoins: 0,
        discountAmount: 0,
        minOrderRequired: sortedRules[0]?.minOrderAmount || 0,
        currentTier: currentRule
          ? {
              minOrderAmount: currentRule.minOrderAmount,
              maxCoinsDeductible: currentRule.maxCoinsDeductible,
              label: currentRule.label,
            }
          : null,
        nextTier: nextTierInfo,
        eligibleMessage: null,
        nudgeMessage: null,
        status: "no_coins",
      };
    }

    if (!currentRule) {
      const lowestRule = sortedRules[0];
      const shortfall = Math.max(0, lowestRule.minOrderAmount - cartTotalAmount);
      const nudgeMessage = `Add ₹${shortfall} more to unlock ₹${lowestRule.maxCoinsDeductible} coin discount!`;

      return {
        userBalance,
        isEligible: false,
        maxDeductible: 0,
        deductedCoins: 0,
        discountAmount: 0,
        minOrderRequired: lowestRule.minOrderAmount,
        currentTier: null,
        nextTier: {
          minOrderAmount: lowestRule.minOrderAmount,
          maxCoinsDeductible: lowestRule.maxCoinsDeductible,
          shortfall,
        },
        eligibleMessage: null,
        nudgeMessage,
        status: "below_minimum",
      };
    }

    const maxAllowedCoins = currentRule.maxCoinsDeductible;
    const deductedCoins = Math.min(userBalance, maxAllowedCoins, cartTotalAmount);
    const isEligible = deductedCoins > 0;

    const currentTier = {
      minOrderAmount: currentRule.minOrderAmount,
      maxCoinsDeductible: currentRule.maxCoinsDeductible,
      label: currentRule.label,
    };

    let nextTier: { minOrderAmount: number; maxCoinsDeductible: number; shortfall: number } | null = null;
    let nudgeMessage: string | null = null;

    if (nextRule) {
      const shortfall = Math.max(0, nextRule.minOrderAmount - cartTotalAmount);
      nextTier = {
        minOrderAmount: nextRule.minOrderAmount,
        maxCoinsDeductible: nextRule.maxCoinsDeductible,
        shortfall,
      };
      // Show milestone upgrade nudge whenever a higher tier exists
      nudgeMessage = `Add ₹${shortfall} more to unlock ₹${nextRule.maxCoinsDeductible} coin discount!`;
    }

    const eligibleMessage = `You're eligible to save up to ₹${deductedCoins} using ${deductedCoins} Homely Coins on this order!`;

    return {
      userBalance,
      isEligible,
      maxDeductible: maxAllowedCoins,
      deductedCoins,
      discountAmount: deductedCoins,
      minOrderRequired: currentRule.minOrderAmount,
      currentTier,
      nextTier,
      eligibleMessage,
      nudgeMessage,
      status: isEligible ? "eligible" : "no_coins",
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
      throw new ApiError(400, "No active coin reward tier applies to this order amount.");
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
    cart.total.coinRemovalNotice = undefined;

    await cart.save();
    return this.getCart(userId, true);
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
      cart.total.coinRemovalNotice = undefined;
      await this.recalculateCartTotals(cart);
      await cart.save();
    }
    return this.getCart(userId, true);
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

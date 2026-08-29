import { IShopDetails } from "../models/shopDetails.model";

export interface ItemPricingResult {
  price: number;
  discountPercent: number;
  discountedPrice: number;
}

export interface ShopDiscountConfig {
  discountMode?: "global" | "item_only" | "hybrid" | "none";
  globalDiscountPercent?: number;
}

/**
 * Calculates the 3-key pricing (price, discountPercent, discountedPrice)
 * based on item-level discount, store discountMode, and globalDiscountPercent.
 *
 * Precedence / Strategy Modes:
 * - 'global': All items receive globalDiscountPercent. Item discount is ignored.
 * - 'item_only': Only items with itemDiscountPercent receive discount. Global discount is ignored.
 * - 'hybrid' (default): Items with itemDiscountPercent use their own discount.
 *                      Remaining items use globalDiscountPercent.
 * - 'none': No discount applied (0%).
 */
export function calculateItemPricing(
  basePrice: number,
  itemDiscountPercent?: number,
  shopConfig?: ShopDiscountConfig | IShopDetails | null
): ItemPricingResult {
  const safeBasePrice = typeof basePrice === "number" && !isNaN(basePrice) ? basePrice : 0;
  const itemDiscount = typeof itemDiscountPercent === "number" && !isNaN(itemDiscountPercent) ? itemDiscountPercent : 0;
  const globalDiscount = typeof shopConfig?.globalDiscountPercent === "number" && !isNaN(shopConfig.globalDiscountPercent)
    ? shopConfig.globalDiscountPercent
    : 0;
  const mode = shopConfig?.discountMode || "hybrid";

  let effectiveDiscount = 0;

  switch (mode) {
    case "global":
      effectiveDiscount = globalDiscount > 0 ? globalDiscount : 0;
      break;
    case "item_only":
      effectiveDiscount = itemDiscount > 0 ? itemDiscount : 0;
      break;
    case "hybrid":
      effectiveDiscount = itemDiscount > 0 ? itemDiscount : (globalDiscount > 0 ? globalDiscount : 0);
      break;
    case "none":
      effectiveDiscount = 0;
      break;
    default:
      effectiveDiscount = itemDiscount > 0 ? itemDiscount : (globalDiscount > 0 ? globalDiscount : 0);
      break;
  }

  // Clamp discount between 0 and 100
  effectiveDiscount = Math.max(0, Math.min(100, effectiveDiscount));

  const discountedPrice =
    effectiveDiscount > 0
      ? Math.max(0, Math.round(safeBasePrice * (1 - effectiveDiscount / 100)))
      : safeBasePrice;

  return {
    price: safeBasePrice,
    discountPercent: effectiveDiscount,
    discountedPrice,
  };
}

import { Fetch, Post, Delete } from "../utils/api";

export interface CartItemInput {
  menuItem: string;
  quantity: number;
  variant?: string;
  isReorder?: boolean;
}

export interface PopulatedCartItem {
  menuItem: {
    _id: string;
    name: string;
    price: number;
    discountPercent?: number;
    discountedPrice?: number;
    image?: string | { url: string };
    category?: string;
    status: string;
  };
  quantity: number;
  variant?: {
    _id: string;
    label: string;
    price: number;
    status: string;
  };
  isReorder?: boolean;
}

export interface CoinRemovalNotice {
  removed: boolean;
  reason: string;
  previousCoins: number;
  maxEligibleCoins: number;
  currentSubTotal: number;
}

export interface CartTotal {
  subTotal: number;
  discount: number;
  deliveryCharge?: number;
  totalAmount: number;
  offer?: {
    _id: string;
    title: string;
    code: string;
    offerType: string;
    discountPercentage?: number;
    flatDiscountAmount?: number;
  };
  offerCode?: string;
  discountType?: "offer" | "coins";
  coinsUsed?: number;
  coinStatus?: "none" | "applied" | "converted" | "cancelled";
  coinRemovalNotice?: CoinRemovalNotice;
}

export interface CoinDeductionResponse {
  userBalance: number;
  isEligible?: boolean;
  maxDeductible: number;
  deductedCoins: number;
  discountAmount: number;
  minOrderRequired?: number;
  currentTier?: {
    minOrderAmount: number;
    maxCoinsDeductible: number;
    label?: string;
  } | null;
  nextTier?: {
    minOrderAmount: number;
    maxCoinsDeductible: number;
    shortfall: number;
  } | null;
  eligibleMessage?: string | null;
  nudgeMessage?: string | null;
  status?: "eligible" | "below_minimum" | "no_coins" | "empty_cart" | "no_rules";
}

export interface CartResponse {
  _id: string;
  user: string;
  items: PopulatedCartItem[];
  total: CartTotal;
  status: "active" | "completed";
}

export interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

export const getBackendCart = async (): Promise<CartResponse | null> => {
  const response = await Fetch<ApiResponse<CartResponse>>("/api/cart");
  return response.data;
};

export const syncBackendCart = async (items: CartItemInput[]): Promise<CartResponse | null> => {
  const response = await Post<ApiResponse<CartResponse>>("/api/cart", { items });
  return response.data;
};

export const applyOfferToCart = async (offerCode: string): Promise<CartResponse> => {
  const response = await Post<ApiResponse<CartResponse>>("/api/cart/apply-offer", { offerCode });
  return response.data;
};

export const removeOfferFromCart = async (): Promise<CartResponse> => {
  const response = await Post<ApiResponse<CartResponse>>("/api/cart/remove-offer", {});
  return response.data;
};

export const getCoinDeduction = async (cartId?: string): Promise<CoinDeductionResponse> => {
  const url = cartId ? `/api/cart/${cartId}/coin-deduction` : "/api/cart/coin-deduction";
  const response = await Fetch<ApiResponse<CoinDeductionResponse>>(url);
  return response.data;
};

export const applyCoinsToCart = async (cartId?: string): Promise<CartResponse> => {
  const response = await Post<ApiResponse<CartResponse>>("/api/cart/apply-coins", { cartId });
  return response.data;
};

export const removeCoinsFromCart = async (cartId?: string): Promise<CartResponse> => {
  const response = await Post<ApiResponse<CartResponse>>("/api/cart/remove-coins", { cartId });
  return response.data;
};

export const clearBackendCart = async (): Promise<void> => {
  await Delete<ApiResponse<void>>("/api/cart");
};

export const checkoutCart = async (cartId: string, orderPayload: any): Promise<any> => {
  const response = await Post<ApiResponse<any>>("/api/cart/checkout", {
    cartId,
    ...orderPayload,
  });
  return response.data;
};

export const reorderCartApi = async (orderId: string): Promise<CartResponse> => {
  const response = await Post<ApiResponse<CartResponse>>("/api/cart/reorder", { orderId });
  return response.data;
};

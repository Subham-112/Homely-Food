import { Fetch, Put, Patch } from "../utils/api";

export interface Address {
  street?: string;
  area?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface ShopDetails {
  _id?: string;
  shopName: string;
  ownerName: string;
  emails: string[];
  phones: string[];
  address: Address;
  serviceablePincodes: string[];
  logo?: string;
  bannerImage?: string;
  openingTime?: string;
  closingTime?: string;
  isStoreOpen: boolean;
  minimumOrderAmount?: number;
  deliveryCharge?: number;
  freeDeliveryThreshold?: number;
  discountMode?: "global" | "item_only" | "hybrid" | "none";
  globalDiscountPercent?: number;
  fssaiLicenseNumber?: string;
  gstNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PincodeCheckResult {
  pincode: string;
  isServiceable: boolean;
}

interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

// GET /api/shop-details
export const getShopDetails = async (): Promise<ShopDetails> => {
  const response = await Fetch<ApiResponse<ShopDetails>>("/api/shop-details");
  return response.data;
};

// PUT /api/shop-details (Admin)
export const updateShopDetails = async (payload: Partial<ShopDetails>): Promise<ShopDetails> => {
  const response = await Put<ApiResponse<ShopDetails>>("/api/shop-details", payload as unknown as Record<string, unknown>);
  return response.data;
};

// PATCH /api/shop-details/toggle-status (Admin)
export const toggleStoreStatus = async (): Promise<{ isStoreOpen: boolean }> => {
  const response = await Patch<ApiResponse<{ isStoreOpen: boolean }>>("/api/shop-details/toggle-status", {});
  return response.data;
};

// GET /api/shop-details/check-pincode/:pincode
export const checkPincode = async (pincode: string): Promise<PincodeCheckResult> => {
  const response = await Fetch<ApiResponse<PincodeCheckResult>>(`/api/shop-details/check-pincode/${pincode}`);
  return response.data;
};

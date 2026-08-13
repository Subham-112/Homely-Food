import { Fetch, Post, Put, Patch, Delete } from "../utils/api";

export interface OfferItemRef {
  _id: string;
  name: string;
  price: number;
  image?: string;
}

export interface Offer {
  _id: string;
  offerType: "BOGO" | "PERCENTAGE" | "FLAT";
  title: string;
  code: string;
  description?: string;
  image: string;
  startDate: string;
  endDate: string;
  isActive: boolean;

  // BOGO
  buyItem?: OfferItemRef;
  buyQuantity?: number;
  freeItem?: OfferItemRef;
  freeQuantity?: number;

  // Percentage & Flat
  minCartValue?: number;
  discountPercentage?: number;
  flatDiscountAmount?: number;
  maxDiscountAmount?: number;

  status?: "active" | "expired" | "inactive" | "upcoming";
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOfferPayload {
  offerType: "BOGO" | "PERCENTAGE" | "FLAT";
  title: string;
  code?: string;
  description?: string;
  image: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;

  buyItem?: string;
  buyQuantity?: number;
  freeItem?: string;
  freeQuantity?: number;

  minCartValue?: number;
  discountPercentage?: number;
  flatDiscountAmount?: number;
  maxDiscountAmount?: number;
}

interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

export const getOffers = async (params?: {
  search?: string;
  type?: "active" | "others" | "all";
}): Promise<Offer[]> => {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.type) query.append("type", params.type);

  const queryString = query.toString();
  const url = queryString ? `/api/offer?${queryString}` : "/api/offer";

  const response = await Fetch<ApiResponse<Offer[]>>(url);
  return response.data || [];
};

export const getOfferById = async (id: string): Promise<Offer> => {
  const response = await Fetch<ApiResponse<Offer>>(`/api/offer/${id}`);
  return response.data;
};

export const createOffer = async (payload: CreateOfferPayload): Promise<Offer> => {
  const response = await Post<ApiResponse<Offer>>("/api/offer", payload as unknown as Record<string, unknown>);
  return response.data;
};

export const updateOffer = async (id: string, payload: Partial<CreateOfferPayload>): Promise<Offer> => {
  const response = await Put<ApiResponse<Offer>>(`/api/offer/${id}`, payload as unknown as Record<string, unknown>);
  return response.data;
};

export const toggleOfferActive = async (id: string): Promise<Offer> => {
  const response = await Patch<ApiResponse<Offer>>(`/api/offer/${id}/toggle-active`, {});
  return response.data;
};

export const repostOffer = async (id: string): Promise<Offer> => {
  const response = await Post<ApiResponse<Offer>>(`/api/offer/${id}/repost`, {});
  return response.data;
};

export const deleteOffer = async (id: string): Promise<{ id: string }> => {
  const response = await Delete<ApiResponse<{ id: string }>>(`/api/offer/${id}`);
  return response.data;
};

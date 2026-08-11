import { Fetch, Post, Delete } from "../utils/api";

export interface CartItemInput {
  menuItem: string;
  quantity: number;
  variant?: string;
}

export interface PopulatedCartItem {
  menuItem: {
    _id: string;
    name: string;
    price: number;
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
}

export interface CartResponse {
  _id: string;
  user: string;
  items: PopulatedCartItem[];
}

export interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

export const getBackendCart = async (): Promise<CartResponse> => {
  const response = await Fetch<ApiResponse<CartResponse>>("/api/cart");
  return response.data;
};

export const syncBackendCart = async (items: CartItemInput[]): Promise<CartResponse> => {
  const response = await Post<ApiResponse<CartResponse>>("/api/cart", { items });
  return response.data;
};

export const clearBackendCart = async (): Promise<void> => {
  await Delete<ApiResponse<void>>("/api/cart");
};

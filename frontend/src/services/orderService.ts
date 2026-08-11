import { Fetch, Post, Patch } from "../utils/api";

export interface CompactMenuItem {
  _id: string;
  name: string;
  image: string;
  price: number;
}

export interface SearchedUser {
  _id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface OrderCartItem {
  menuItem: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: {
    variantId?: string;
    label?: string;
    price?: number;
  };
}

export interface CreateOrderPayload {
  userId?: string;
  guest?: {
    name: string;
    phone: string;
    email?: string;
  };
  items: {
    menuItem: string;
    name?: string;
    price?: number;
    quantity: number;
    variant?: {
      variantId?: string;
      label?: string;
      price?: number;
    };
  }[];
  payment?: {
    method?: string;
    status?: string;
    transactionId?: string;
  };
  notes?: string;
  discount?: number;
}

export interface CompactMenuItemsResponse {
  items: CompactMenuItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

export const getCompactMenuItems = async (params?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<CompactMenuItemsResponse> => {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());

  const response = await Fetch<ApiResponse<CompactMenuItemsResponse>>(
    `/api/menu-item/order-list?${query.toString()}`
  );
  return response.data;
};

export const searchUserByPhone = async (phone: string): Promise<SearchedUser[]> => {
  if (!phone || !phone.trim()) return [];
  const response = await Fetch<ApiResponse<SearchedUser[]>>(
    `/api/user/search-by-phone?phone=${encodeURIComponent(phone.trim())}`
  );
  return response.data || [];
};

export const createOrder = async (payload: CreateOrderPayload) => {
  const response = await Post<ApiResponse<any>>("/api/order", payload as unknown as Record<string, unknown>);
  return response.data;
};

// --- Order List (Admin) ---

export interface OrderItem {
  menuItem: string;
  name: string;
  price: number;
  quantity: number;
  variant?: {
    variantId?: string;
    label?: string;
    price?: number;
  };
}

export interface Order {
  _id: string;
  orderNumber: string;
  user?: string;
  guest: {
    name: string;
    phone: string;
    email?: string;
  };
  items: OrderItem[];
  payment: {
    method: string;
    status: string;
    transactionId?: string;
    amount: number;
  };
  status: string;
  subTotal: number;
  discount: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  orders: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const getOrders = async (params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<OrdersResponse> => {
  const query = new URLSearchParams();
  if (params?.status) query.append("status", params.status);
  if (params?.search) query.append("search", params.search);
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());

  const response = await Fetch<ApiResponse<OrdersResponse>>(
    `/api/order?${query.toString()}`
  );
  return response.data;
};

export const updateOrderStatus = async (
  orderId: string,
  status: string
): Promise<Order> => {
  const response = await Patch<ApiResponse<Order>>(
    `/api/order/${orderId}/status`,
    { status } as Record<string, unknown>
  );
  return response.data;
};

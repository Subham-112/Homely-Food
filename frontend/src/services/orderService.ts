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
  orderType?: "dine-in" | "delivery" | "pickup";
  deliveryAddress?: string;
  pickupTiming?: string;
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
  menuItem: {
    name: string;
    _id: string;
    price?: number;
  };
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
  customer?: string;
  orderFor?: "registered_user" | "guest";
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
  orderType: "dine-in" | "delivery" | "pickup";
  deliveryAddress?: string;
  pickupTiming?: string;
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
  orderType?: string;
  search?: string;
  page?: number;
  limit?: number;
  userId?: string;
}): Promise<OrdersResponse> => {
  const query = new URLSearchParams();
  if (params?.status) query.append("status", params.status);
  if (params?.orderType) query.append("orderType", params.orderType);
  if (params?.search) query.append("search", params.search);
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.userId) query.append("userId", params.userId);

  const queryString = query.toString();
  const url = queryString ? `/api/order?${queryString}` : "/api/order";

  const response = await Fetch<ApiResponse<OrdersResponse>>(url);
  return response.data;
};

export const getMyOrders = async (status?: string): Promise<Order[]> => {
  const query = new URLSearchParams();
  if (status && status.trim() && status.toLowerCase() !== "all") {
    query.append("status", status.trim().toLowerCase());
  }
  const queryString = query.toString();
  const url = queryString ? `/api/order/my-orders?${queryString}` : "/api/order/my-orders";

  const response = await Fetch<ApiResponse<Order[]>>(url);
  return response.data || [];
};

export const getOrderById = async (id: string): Promise<Order> => {
  const response = await Fetch<ApiResponse<Order>>(`/api/order/${encodeURIComponent(id)}`);
  return response.data;
};

export const updateOrderStatus = async (
  orderId: string,
  status: string,
  paymentMethod?: string,
  isPaid?: boolean
): Promise<Order> => {
  const response = await Patch<ApiResponse<Order>>(
    `/api/order/${orderId}/status`,
    { status, paymentMethod, isPaid } as Record<string, unknown>
  );
  return response.data;
};

export interface OrderStats {
  total: number;
  pending: number;
  preparing: number;
  completed: number;
}

export const getOrderStats = async (): Promise<OrderStats> => {
  const response = await Fetch<ApiResponse<OrderStats>>("/api/order/stats");
  return response.data;
};

import { Fetch, Post, Put, Delete } from "../utils/api";

export interface ApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  data: T;
}

export interface CustomerGroupSummary {
  id: string;
  name: string;
  color?: string;
  discount?: {
    type: "percentage" | "flat";
    value: number;
    maxOrdersPerCustomer: number;
    minOrderAmount: number;
    active: boolean;
    validUntil?: string;
  };
}

export interface CustomerProfile {
  _id: string;
  phone: string;
  primaryName: string;
  customerType: "registered" | "guest";
  orderCount: number;
  totalExpenses: number;
  createdAt: string;
  updatedAt: string;
  groups?: CustomerGroupSummary[];
}

export interface GetCustomersParams {
  sortBy?: "name" | "orderCount" | "totalExpenses";
  order?: "asc" | "desc";
}

export interface IGroupDiscount {
  type: "percentage" | "flat";
  value: number;
  maxOrdersPerCustomer: number; // 0 = unlimited
  minOrderAmount: number;
  active: boolean;
  validUntil?: string;
}

export interface CustomerGroupItem {
  _id: string;
  name: string;
  description?: string;
  color?: string;
  customerIds: any[];
  memberCount: number;
  discount: IGroupDiscount;
  createdAt: string;
  updatedAt: string;
}

export const getCustomers = async (params?: GetCustomersParams): Promise<CustomerProfile[]> => {
  const query = new URLSearchParams();
  if (params?.sortBy) query.append("sortBy", params.sortBy);
  if (params?.order) query.append("order", params.order);
  const queryString = query.toString() ? `?${query.toString()}` : "";
  const response = await Fetch<ApiResponse<CustomerProfile[]>>(`/api/customer${queryString}`);
  return response.data;
};

// --- Customer Groups API Functions ---

export const getCustomerGroups = async (): Promise<CustomerGroupItem[]> => {
  const response = await Fetch<ApiResponse<CustomerGroupItem[]>>("/api/customer/groups");
  return response.data;
};

export const createCustomerGroup = async (payload: {
  name: string;
  description?: string;
  color?: string;
  customerIds?: string[];
}): Promise<CustomerGroupItem> => {
  const response = await Post<ApiResponse<CustomerGroupItem>>("/api/customer/groups", payload);
  return response.data;
};

export const updateCustomerGroup = async (
  id: string,
  payload: { name?: string; description?: string; color?: string }
): Promise<CustomerGroupItem> => {
  const response = await Put<ApiResponse<CustomerGroupItem>>(`/api/customer/groups/${id}`, payload);
  return response.data;
};

export const deleteCustomerGroup = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await Delete<ApiResponse<any>>(`/api/customer/groups/${id}`);
  return { success: response.success, message: response.message };
};

export const updateCustomerGroupDiscount = async (
  id: string,
  payload: Partial<IGroupDiscount>
): Promise<CustomerGroupItem> => {
  const response = await Put<ApiResponse<CustomerGroupItem>>(`/api/customer/groups/${id}/discount`, payload);
  return response.data;
};

export const assignCustomersToGroup = async (
  id: string,
  payload: { customerIds: string[]; action: "add" | "remove" | "set" }
): Promise<CustomerGroupItem> => {
  const response = await Post<ApiResponse<CustomerGroupItem>>(`/api/customer/groups/${id}/customers`, payload);
  return response.data;
};

export const getCustomerPerk = async (customerIdOrPhone: string): Promise<any> => {
  const response = await Fetch<ApiResponse<any>>(`/api/customer/perks/${encodeURIComponent(customerIdOrPhone)}`);
  return response.data;
};

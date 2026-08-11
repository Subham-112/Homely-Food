import { Fetch } from "../utils/api";

export interface ApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  data: T;
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
}

export const getCustomers = async (): Promise<CustomerProfile[]> => {
  const response = await Fetch<ApiResponse<CustomerProfile[]>>("/api/customer");
  return response.data;
};

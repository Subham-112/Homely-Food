import { Fetch, Post } from "../utils/api";

export interface VerifyPaymentInput {
  paymentId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface PaymentRecord {
  _id: string;
  order?: any;
  user?: any;
  gateway: string;
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  paymentMode?: string;
  capturedAt?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

export const verifyPayment = async (input: VerifyPaymentInput): Promise<{ order: any; payment: PaymentRecord }> => {
  const response = await Post<ApiResponse<{ order: any; payment: PaymentRecord }>>("/api/payment/verify", input as unknown as Record<string, unknown>);
  return response.data;
};

export const getPaymentByOrder = async (orderId: string): Promise<PaymentRecord> => {
  const response = await Fetch<ApiResponse<PaymentRecord>>(`/api/payment/order/${orderId}`);
  return response.data;
};

export const getMyPayments = async (): Promise<PaymentRecord[]> => {
  const response = await Fetch<ApiResponse<PaymentRecord[]>>("/api/payment/my-payments");
  return response.data || [];
};

export const getAdminPayments = async (params?: {
  status?: string;
  method?: string;
  paymentMode?: string;
  page?: number;
  limit?: number;
}): Promise<{ payments: PaymentRecord[]; pagination: any }> => {
  const query = new URLSearchParams();
  if (params?.status) query.append("status", params.status);
  if (params?.method) query.append("method", params.method);
  if (params?.paymentMode) query.append("paymentMode", params.paymentMode);
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());

  const response = await Fetch<ApiResponse<{ payments: PaymentRecord[]; pagination: any }>>(
    `/api/payment/admin?${query.toString()}`
  );
  return response.data;
};

export const getAdminPaymentAnalytics = async (params?: {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  method?: string;
  groupBy?: string;
}): Promise<{ totals: any; byGroup: any[] }> => {
  const query = new URLSearchParams();
  if (params?.dateFrom) query.append("dateFrom", params.dateFrom);
  if (params?.dateTo) query.append("dateTo", params.dateTo);
  if (params?.status) query.append("status", params.status);
  if (params?.method) query.append("method", params.method);
  if (params?.groupBy) query.append("groupBy", params.groupBy);

  const response = await Fetch<ApiResponse<{ totals: any; byGroup: any[] }>>(
    `/api/payment/admin/analytics?${query.toString()}`
  );
  return response.data;
};

export const initiateRefund = async (paymentId: string, payload?: { amount?: number; reason?: string }): Promise<PaymentRecord> => {
  const response = await Post<ApiResponse<PaymentRecord>>(
    `/api/payment/admin/${paymentId}/refund`,
    (payload || {}) as Record<string, unknown>
  );
  return response.data;
};

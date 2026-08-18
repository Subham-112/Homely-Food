export interface IRazorpayCreateOrderInput {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
  config_id?: string;
}

export interface IRazorpayOrderOutput {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  created_at: number;
}

export interface IRazorpayVerifySignatureInput {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface IRazorpayRefundInput {
  paymentId: string;
  amount?: number;
  notes?: Record<string, string>;
}

export interface IRazorpayRefundOutput {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  payment_id: string;
  status: string;
}

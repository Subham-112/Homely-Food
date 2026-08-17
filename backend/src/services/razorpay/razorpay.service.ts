import crypto from "crypto";
import { getRazorpayInstance } from "./razorpay.client";
import { config } from "../../config/config";
import ApiError from "../../utils/ApiError";
import { timingSafeCompare } from "../../utils/webhookSecurity";
import {
  IRazorpayCreateOrderInput,
  IRazorpayOrderOutput,
  IRazorpayVerifySignatureInput,
  IRazorpayRefundInput,
  IRazorpayRefundOutput,
} from "./razorpay.types";

export class RazorpayService {
  public async createOrder(input: IRazorpayCreateOrderInput): Promise<IRazorpayOrderOutput> {
    try {
      const razorpay = getRazorpayInstance();
      const options = {
        amount: Math.round(input.amount),
        currency: input.currency || config.razorpay.currency || "INR",
        receipt: input.receipt,
        notes: input.notes,
      };
      const response = await razorpay.orders.create(options);
      return response as unknown as IRazorpayOrderOutput;
    } catch (error: any) {
      throw new ApiError(
        error.statusCode || 500,
        `Razorpay create order failed: ${error.description || error.message || "Unknown error"}`
      );
    }
  }

  public verifyPaymentSignature(input: IRazorpayVerifySignatureInput): boolean {
    if (!config.razorpay.keySecret) {
      throw new ApiError(500, "Razorpay key secret not configured");
    }
    const body = `${input.orderId}|${input.paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", config.razorpay.keySecret)
      .update(body)
      .digest("hex");
    return timingSafeCompare(expectedSignature, input.signature);
  }

  public verifyWebhookSignature(rawBody: string | Buffer, signatureHeader: string): boolean {
    if (!config.razorpay.webhookSecret) {
      throw new ApiError(500, "Razorpay webhook secret not configured");
    }
    const expectedSignature = crypto
      .createHmac("sha256", config.razorpay.webhookSecret)
      .update(rawBody)
      .digest("hex");
    return timingSafeCompare(expectedSignature, signatureHeader);
  }

  public async fetchPayment(paymentId: string): Promise<any> {
    try {
      const razorpay = getRazorpayInstance();
      return await razorpay.payments.fetch(paymentId);
    } catch (error: any) {
      throw new ApiError(
        error.statusCode || 500,
        `Razorpay fetch payment failed: ${error.description || error.message}`
      );
    }
  }

  public async createRefund(input: IRazorpayRefundInput): Promise<IRazorpayRefundOutput> {
    try {
      const razorpay = getRazorpayInstance();
      const options: any = {};
      if (input.amount) {
        options.amount = Math.round(input.amount);
      }
      if (input.notes) {
        options.notes = input.notes;
      }
      const refund = await razorpay.payments.refund(input.paymentId, options);
      return refund as unknown as IRazorpayRefundOutput;
    } catch (error: any) {
      throw new ApiError(
        error.statusCode || 500,
        `Razorpay refund failed: ${error.description || error.message}`
      );
    }
  }
}

export default new RazorpayService();

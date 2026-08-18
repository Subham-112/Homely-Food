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
      const options: any = {
        amount: Math.round(input.amount),
        currency: input.currency || config.razorpay.currency || "INR",
        receipt: input.receipt,
        notes: input.notes,
      };

      const response = await razorpay.orders.create(options);
      return response as unknown as IRazorpayOrderOutput;
    } catch (error: any) {
      console.error("Razorpay createOrder raw error detail:", error?.error || error);
      const errorMsg =
        error?.error?.description || error?.description || error?.message || JSON.stringify(error);
      throw new ApiError(
        error.statusCode || 400,
        `Razorpay create order failed: ${errorMsg}`
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

  public extractPaymentDetails(rawPayment: any): any {
    if (!rawPayment) return undefined;

    const method = rawPayment.method || "";
    let methodDetails: any = { type: method };

    if (method === "upi") {
      methodDetails.vpa = rawPayment.vpa || "";
      methodDetails.payerAccountType = rawPayment.ac_type || rawPayment.payer_account_type || "Bank Account";
    } else if (method === "card") {
      methodDetails.cardNetwork = rawPayment.card?.network || rawPayment.network || "";
      methodDetails.cardType = rawPayment.card?.type || "";
      methodDetails.cardLast4 = rawPayment.card?.last4 || "";
    } else if (method === "netbanking") {
      methodDetails.bankName = rawPayment.bank || "";
    } else if (method === "wallet") {
      methodDetails.walletName = rawPayment.wallet || "";
    }

    const feeInPaise = Number(rawPayment.fee || 0);
    const taxInPaise = Number(rawPayment.tax || 0);
    const totalFeeRupees = feeInPaise / 100;
    const gstRupees = taxInPaise / 100;
    const razorpayFeeRupees = Math.max(0, totalFeeRupees - gstRupees);

    const acquirerData = rawPayment.acquirer_data || {};
    const bankRrnVal =
      acquirerData.bank_transaction_id ||
      acquirerData.rrn ||
      acquirerData.auth_code ||
      rawPayment.ac_rrn ||
      rawPayment.rrn ||
      rawPayment.bank_rrn ||
      "";

    return {
      bankRrn: bankRrnVal,
      invoiceId: rawPayment.invoice_id || "",
      paymentMethodDetails: methodDetails,
      customerDetails: {
        contact: rawPayment.contact || "",
        email: rawPayment.email || "",
      },
      feeDetails: {
        totalFee: totalFeeRupees,
        razorpayFee: razorpayFeeRupees,
        gst: gstRupees,
        feeBearer: rawPayment.fee_bearer || "You pay the Razorpay platform fee",
      },
      appName: rawPayment.notes?.appName || "",
      appId: rawPayment.notes?.appId || "",
      description: rawPayment.description || "Food Order Payment",
      notes: rawPayment.notes || {},
      rawGatewayResponse: rawPayment,
    };
  }
}

export default new RazorpayService();

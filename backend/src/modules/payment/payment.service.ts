import { Payment, IPayment } from "../../models/payment.model";
import Cart from "../../models/cart.model";
import PaymentEvent from "../../models/paymentEvent.model";
import Order from "../../models/order.model";
import { OrderService, ICreateOrderPayload } from "../order/order.service";
import razorpayService from "../../services/razorpay/razorpay.service";
import { config } from "../../config/config";
import ApiError from "../../utils/ApiError";
import { CartStatus, PaymentGateway, PaymentMethod, PaymentStatus } from "../../common/enum";
import { emitNewOrder, emitOrderStatusUpdate, getIO } from "../../socket/socketService";
import mongoose from "mongoose";

export class PaymentService {
  public static async createPendingCheckout(payload: ICreateOrderPayload, userId?: string) {
    // 1. Validate payload using OrderService (without persisting order)
    const validated = await OrderService.validateOrderPayload({ ...payload, userId });
    const totalAmount = validated.totalAmount;
    const amountInPaise = Math.round(totalAmount * 100);

    const receipt = `RCPT-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;

    // 2. Create Razorpay order
    const razorpayOrder = await razorpayService.createOrder({
      amount: amountInPaise,
      currency: config.razorpay.currency || "INR",
      receipt,
      notes: {
        guestName: validated.guestData.name || "Guest",
        guestPhone: validated.guestData.phone || "",
      },
    });

    // 3. Set expiry timestamp (default 20 min)
    const ttlMinutes = config.razorpay.ttlMinutes || 20;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    // 4. Save Payment intent document
    const payment = await Payment.create({
      order: null,
      draftPayload: { ...payload, userId },
      user: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      gateway: PaymentGateway.RAZORPAY,
      gatewayOrderId: razorpayOrder.id,
      amount: totalAmount,
      amountInPaise,
      currency: razorpayOrder.currency || "INR",
      status: PaymentStatus.CREATED,
      method: PaymentMethod.RAZORPAY,
      expiresAt,
    });

    return {
      requiresPayment: true,
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
      amountInPaise,
      currency: razorpayOrder.currency,
      key: config.razorpay.keyId,
      configId: config.razorpay.configId,
      paymentId: String(payment._id),
    };
  }

  public static async verifyPayment(input: {
    paymentId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const payment = await Payment.findById(input.paymentId);
    if (!payment) {
      throw new ApiError(404, "Payment transaction record not found.");
    }

    // Idempotency check: If order is already created (e.g. by fast webhook), return existing order
    if (payment.order) {
      const existingOrder = await OrderService.getById(String(payment.order));
      return { order: existingOrder, payment };
    }

    // Verify HMAC signature
    const isValid = razorpayService.verifyPaymentSignature({
      orderId: input.razorpayOrderId,
      paymentId: input.razorpayPaymentId,
      signature: input.razorpaySignature,
    });

    if (!isValid) {
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = "Invalid payment signature";
      await payment.save();
      throw new ApiError(400, "Payment signature verification failed.");
    }

    // Payment Signature verified! Save transaction details
    payment.gatewayPaymentId = input.razorpayPaymentId;
    payment.gatewaySignature = input.razorpaySignature;
    payment.status = PaymentStatus.PAID;
    payment.capturedAt = new Date();

    // Create real Order for the first time
    const draftPayload: ICreateOrderPayload = payment.draftPayload as ICreateOrderPayload;
    if (!draftPayload) {
      throw new ApiError(400, "Draft order payload missing from payment session.");
    }

    const createdOrder = await OrderService.create(
      {
        ...draftPayload,
        paymentPreference: "ONLINE",
        payment: {
          method: PaymentMethod.RAZORPAY,
          status: PaymentStatus.PAID,
          transactionId: input.razorpayPaymentId,
        },
      },
      payment._id
    );

    // Link payment to order
    payment.order = createdOrder._id as mongoose.Types.ObjectId;
    payment.draftPayload = undefined; // clear transient payload
    await payment.save();

    // Mark active cart as completed
    const targetUserId = payment.user || draftPayload.userId;
    if (targetUserId) {
      try {
        await Cart.updateMany(
          { user: targetUserId, status: CartStatus.ACTIVE },
          { $set: { status: CartStatus.COMPLETED } }
        );
      } catch (cartErr) {
        console.error("Failed to update cart status to completed:", cartErr);
      }
    }

    // Emit Socket events
    try {
      const io = getIO();
      const orderIdStr = createdOrder.orderNumber || String(createdOrder._id);
      io.to(`order_${orderIdStr}`).emit("payment:updated", { payment, order: createdOrder });
      io.to("admin_room").emit("payment:updated", { payment, order: createdOrder });
    } catch (e) {
      console.error("Failed emitting payment:updated socket event:", e);
    }

    return { order: createdOrder, payment };
  }

  public static async createCodPaymentRecord(orderId: string, amount: number, userId?: string) {
    const payment = await Payment.create({
      order: new mongoose.Types.ObjectId(orderId),
      user: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      gateway: PaymentGateway.RAZORPAY,
      gatewayOrderId: `COD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      amount,
      amountInPaise: Math.round(amount * 100),
      currency: "INR",
      status: PaymentStatus.PENDING,
      method: PaymentMethod.COD,
    });

    await Order.findByIdAndUpdate(orderId, { "payment.paymentRef": payment._id });
    return payment;
  }

  public static async markCodPaid(orderId: string, method: PaymentMethod = PaymentMethod.CASH) {
    const order = await Order.findById(orderId);
    if (!order) return null;

    let payment = await Payment.findOne({ order: order._id });
    if (!payment) {
      payment = new Payment({
        order: order._id,
        user: order.user,
        gateway: PaymentGateway.RAZORPAY,
        gatewayOrderId: `MANUAL-${Date.now()}`,
        amount: order.payment.totalAmount,
        amountInPaise: Math.round(order.payment.totalAmount * 100),
        currency: "INR",
        status: PaymentStatus.PAID,
        method,
        capturedAt: new Date(),
      });
    } else {
      payment.status = PaymentStatus.PAID;
      payment.method = method;
      payment.capturedAt = new Date();
    }
    await payment.save();

    order.payment.status = PaymentStatus.PAID;
    order.payment.method = method;
    order.payment.paymentRef = payment._id as mongoose.Types.ObjectId;
    await order.save();

    return payment;
  }

  public static async getPaymentByOrder(orderId: string) {
    return Payment.findOne({ order: orderId });
  }

  public static async getMyPayments(userId: string) {
    return Payment.find({ user: userId }).sort({ createdAt: -1 });
  }

  public static async getAdminPayments(query: {
    status?: PaymentStatus;
    method?: PaymentMethod;
    paymentMode?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.method) filter.method = query.method;
    if (query.paymentMode) filter.paymentMode = query.paymentMode;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("order", "_id orderNumber guest status orderType totalAmount")
        .populate("user", "_id name phone email"),
      Payment.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      payments,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  public static async initiateRefund(paymentId: string, input: { amount?: number; reason?: string }) {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new ApiError(404, "Payment record not found.");
    }
    if (payment.status !== PaymentStatus.PAID && payment.status !== PaymentStatus.PARTIALLY_REFUNDED) {
      throw new ApiError(400, "Only paid payments can be refunded.");
    }

    const alreadyRefundedPaise = payment.refunds.reduce((sum, r) => sum + Math.round(r.amount * 100), 0);
    const refundAmountPaise = input.amount ? Math.round(input.amount * 100) : payment.amountInPaise - alreadyRefundedPaise;

    if (refundAmountPaise <= 0 || refundAmountPaise > payment.amountInPaise - alreadyRefundedPaise) {
      throw new ApiError(400, "Invalid refund amount.");
    }

    if (!payment.gatewayPaymentId) {
      throw new ApiError(400, "Cannot refund payment without a gateway transaction ID.");
    }

    const refundRes = await razorpayService.createRefund({
      paymentId: payment.gatewayPaymentId,
      amount: refundAmountPaise,
      notes: { reason: input.reason || "Admin initiated refund" },
    });

    const refundAmountRupees = refundAmountPaise / 100;

    payment.refunds.push({
      refundId: refundRes.id,
      amount: refundAmountRupees,
      status: refundRes.status || "processed",
      reason: input.reason,
      createdAt: new Date(),
    });

    const totalRefundedPaise = alreadyRefundedPaise + refundAmountPaise;
    if (totalRefundedPaise >= payment.amountInPaise) {
      payment.status = PaymentStatus.REFUNDED;
    } else {
      payment.status = PaymentStatus.PARTIALLY_REFUNDED;
    }

    await payment.save();

    // Sync Order snapshot if linked
    if (payment.order) {
      await Order.findByIdAndUpdate(payment.order, {
        "payment.status": payment.status,
      });
    }

    try {
      const io = getIO();
      io.to("admin_room").emit("refund:updated", { payment });
    } catch (e) {
      console.error("Failed emitting refund:updated socket event:", e);
    }

    return payment;
  }
}

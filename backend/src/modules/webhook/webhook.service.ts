import { Payment, IPayment } from "../../models/payment.model";
import Cart from "../../models/cart.model";
import PaymentEvent from "../../models/paymentEvent.model";
import { OrderService } from "../order/order.service";
import razorpayService from "../../services/razorpay/razorpay.service";
import { CartStatus, PaymentStatus } from "../../common/enum";
import { getIO } from "../../socket/socketService";

export class WebhookService {
  public static async handleRazorpayWebhook(rawBody: string | Buffer, signatureHeader: string) {
    // 1. Signature Verification
    const isValid = razorpayService.verifyWebhookSignature(rawBody, signatureHeader);
    const bodyString = typeof rawBody === "string" ? rawBody : rawBody.toString("utf-8");
    const payload = JSON.parse(bodyString);

    const eventId = payload.event_id || payload.contains?.[0] || `EVT-${Date.now()}`;
    const eventType = payload.event;
    const gatewayOrderId = payload.payload?.payment?.entity?.order_id;

    // 2. Idempotency Check on PaymentEvent
    const existingEvent = await PaymentEvent.findOne({ eventId });
    if (existingEvent) {
      return { success: true, message: "Event already processed (idempotent)." };
    }

    // 3. Persist raw event log (processed = false)
    const paymentEvent = await PaymentEvent.create({
      eventId,
      eventType,
      gatewayOrderId,
      rawPayload: payload,
      signatureValid: isValid,
      processed: false,
    });

    if (!isValid) {
      paymentEvent.processingError = "Invalid webhook signature";
      await paymentEvent.save();
      return { success: false, message: "Invalid webhook signature." };
    }

    // 4. Process event business logic
    try {
      if (eventType === "payment.captured") {
        const paymentEntity = payload.payload?.payment?.entity;
        if (paymentEntity && paymentEntity.order_id) {
          const payment = await Payment.findOne({ gatewayOrderId: paymentEntity.order_id });
          if (payment) {
            paymentEvent.payment = payment._id;
            payment.gatewayPaymentId = paymentEntity.id;
            payment.paymentMode = paymentEntity.method;
            payment.status = PaymentStatus.PAID;
            payment.capturedAt = new Date();

            // If order was not yet created (e.g. client closed browser before /verify)
            if (!payment.order && payment.draftPayload) {
              const draftPayload = payment.draftPayload as any;
              const createdOrder = await OrderService.create(
                {
                  ...draftPayload,
                  paymentPreference: "ONLINE",
                  payment: {
                    method: payment.method,
                    status: PaymentStatus.PAID,
                    transactionId: paymentEntity.id,
                  },
                },
                payment._id
              );
              payment.order = createdOrder._id as any;
              payment.draftPayload = undefined;

              const targetUserId = payment.user || draftPayload.userId;
              if (targetUserId) {
                try {
                  await Cart.updateMany(
                    { user: targetUserId, status: CartStatus.ACTIVE },
                    { $set: { status: CartStatus.COMPLETED } }
                  );
                } catch (cErr) {
                  console.error("Failed updating cart status in webhook:", cErr);
                }
              }
            }

            await payment.save();

            // Emit socket updates
            try {
              const io = getIO();
              io.to("admin_room").emit("payment:updated", { payment });
            } catch (e) {
              console.error("Failed emitting socket event from webhook:", e);
            }
          }
        }
      } else if (eventType === "payment.failed") {
        const paymentEntity = payload.payload?.payment?.entity;
        if (paymentEntity && paymentEntity.order_id) {
          const payment = await Payment.findOne({ gatewayOrderId: paymentEntity.order_id });
          if (payment) {
            paymentEvent.payment = payment._id;
            payment.status = PaymentStatus.FAILED;
            payment.failureReason = paymentEntity.error_description || "Payment failed at gateway";
            await payment.save();
          }
        }
      } else if (eventType === "refund.processed") {
        const refundEntity = payload.payload?.refund?.entity;
        if (refundEntity && refundEntity.payment_id) {
          const payment = await Payment.findOne({ gatewayPaymentId: refundEntity.payment_id });
          if (payment) {
            paymentEvent.payment = payment._id;
            const refundIdx = payment.refunds.findIndex((r) => r.refundId === refundEntity.id);
            if (refundIdx > -1) {
              payment.refunds[refundIdx].status = "processed";
            }
            await payment.save();
          }
        }
      }

      paymentEvent.processed = true;
      await paymentEvent.save();
      return { success: true, message: "Webhook processed successfully." };
    } catch (err: any) {
      paymentEvent.processingError = err.message || "Error processing webhook";
      await paymentEvent.save();
      throw err;
    }
  }
}

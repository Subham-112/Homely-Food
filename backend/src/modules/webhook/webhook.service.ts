import { Payment } from "../../models/payment.model";
import Cart from "../../models/cart.model";
import PaymentEvent from "../../models/paymentEvent.model";
import { OrderService } from "../order/order.service";
import razorpayService from "../../services/razorpay/razorpay.service";
import { CartStatus, PaymentStatus, CoinTransactionType } from "../../common/enum";
import { getIO } from "../../socket/socketService";
import { CoinService } from "../coin/coin.service";
import DistributedLockService from "../../services/lock/distributedLock.service";
import { logger } from "../../config/logger";

export class WebhookService {
  public static async handleRazorpayWebhook(rawBody: string | Buffer | any, signatureHeader: string) {
    // 1. Prepare raw buffer / string for signature verification
    let bodyBuffer: Buffer;
    let payload: any;

    if (Buffer.isBuffer(rawBody)) {
      bodyBuffer = rawBody;
      payload = JSON.parse(rawBody.toString("utf-8"));
    } else if (typeof rawBody === "string") {
      bodyBuffer = Buffer.from(rawBody, "utf-8");
      payload = JSON.parse(rawBody);
    } else if (typeof rawBody === "object") {
      bodyBuffer = Buffer.from(JSON.stringify(rawBody), "utf-8");
      payload = rawBody;
    } else {
      logger.error("❌ Rejected webhook: Invalid webhook body format.");
      return { success: false, message: "Invalid webhook body format." };
    }

    const eventId = payload.event_id || payload.contains?.[0] || `EVT-${Date.now()}`;
    const eventType = payload.event;
    const gatewayOrderId =
      payload.payload?.payment?.entity?.order_id ||
      payload.payload?.order?.entity?.id;

    logger.info(
      `📥 [Webhook] Received Razorpay event: "${eventType}" [Event ID: ${eventId}] for Gateway Order: "${gatewayOrderId || "N/A"}"`
    );

    // 2. Cryptographic Signature Verification
    const isValid = razorpayService.verifyWebhookSignature(bodyBuffer, signatureHeader);

    // 3. Webhook Idempotency Check (Deduplication)
    const existingEvent = await PaymentEvent.findOne({ eventId });
    if (existingEvent) {
      logger.info(`ℹ️ [Webhook] Event "${eventId}" already received and processed (idempotent no-op).`);
      return { success: true, message: "Event already processed (idempotent duplicate)." };
    }

    // 4. Persist raw event log
    let paymentEvent;
    try {
      paymentEvent = await PaymentEvent.create({
        eventId,
        eventType,
        gatewayOrderId,
        rawPayload: payload,
        signatureValid: isValid,
        processed: false,
      });
    } catch (err: any) {
      if (err.code === 11000) {
        logger.info(`ℹ️ [Webhook] Event "${eventId}" concurrent insert deduplicated.`);
        return { success: true, message: "Event already processed (idempotent duplicate)." };
      }
      throw err;
    }

    if (!isValid) {
      paymentEvent.processingError = "Invalid webhook signature";
      await paymentEvent.save();
      logger.warn(`❌ [Webhook] Rejected event "${eventId}": signature verification failed.`);
      return { success: false, message: "Invalid webhook signature." };
    }

    // 5. Concurrency Control: Execute inside a distributed lock boundary per gatewayOrderId
    const lockKey = gatewayOrderId ? `payment_order_${gatewayOrderId}` : `webhook_event_${eventId}`;

    return await DistributedLockService.withLock(
      lockKey,
      { ttlSeconds: 30, maxRetries: 3, retryDelayMs: 200 },
      async () => {
        try {
          if (eventType === "payment.captured" || eventType === "payment.authorized" || eventType === "order.paid") {
            const paymentEntity = payload.payload?.payment?.entity;
            const targetOrderId = paymentEntity?.order_id || gatewayOrderId;

            if (targetOrderId) {
              const payment = await Payment.findOne({ gatewayOrderId: targetOrderId });
              if (payment) {
                paymentEvent.payment = payment._id;

                // Enforce state transition
                if (payment.status !== PaymentStatus.PAID) {
                  payment.transitionTo(PaymentStatus.PAID);
                }

                if (paymentEntity?.id) {
                  payment.gatewayPaymentId = paymentEntity.id;
                }
                payment.capturedAt = new Date();
                if (paymentEntity?.method) {
                  payment.paymentMode = paymentEntity.method.toUpperCase();
                }
                if (paymentEntity) {
                  payment.details = razorpayService.extractPaymentDetails(paymentEntity);
                }

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
                        transactionId: paymentEntity?.id || payment.gatewayPaymentId || "GATEWAY_VERIFIED",
                      },
                    },
                    payment._id
                  );
                  payment.order = createdOrder._id as any;
                  payment.draftPayload = undefined;

                  const targetUserId = payment.user || draftPayload.userId;
                  if (targetUserId) {
                    try {
                      const activeCart = await Cart.findOne({ user: targetUserId, status: CartStatus.ACTIVE });
                      if (activeCart) {
                        if (activeCart.total?.discountType === "coins" && activeCart.total?.coinsUsed && activeCart.total.coinsUsed > 0) {
                          activeCart.total.coinStatus = "converted";
                          try {
                            await CoinService.debitWallet(targetUserId.toString(), activeCart.total.coinsUsed, {
                              type: CoinTransactionType.SPENT,
                              reason: "Applied for Discount",
                              orderId: createdOrder._id.toString(),
                            });
                          } catch (coinErr) {
                            logger.error("Failed to debit coin wallet on webhook payment capture:", coinErr);
                          }
                        }
                        activeCart.status = CartStatus.COMPLETED;
                        await activeCart.save();
                      }
                    } catch (cErr) {
                      logger.error("Failed updating cart status in webhook:", cErr);
                    }
                  }

                  logger.info(
                    `📦 [Webhook] Created & fulfilled Order ${createdOrder.orderNumber || createdOrder._id} for captured webhook.`
                  );
                }

                await payment.save();

                logger.info(
                  `✅ [Webhook] Successfully transitioned payment "${payment._id}" (Order: ${targetOrderId}) to PAID.`
                );

                // Emit socket updates
                try {
                  const io = getIO();
                  io.to("admin_room").emit("payment:updated", { payment });
                  if (payment.order) {
                    io.to(`order_${String(payment.order)}`).emit("payment:updated", { payment });
                  }
                } catch (e) {
                  logger.error("Failed emitting socket event from webhook:", e);
                }
              }
            }
          } else if (eventType === "payment.failed") {
            const paymentEntity = payload.payload?.payment?.entity;
            if (paymentEntity && paymentEntity.order_id) {
              const payment = await Payment.findOne({ gatewayOrderId: paymentEntity.order_id });
              if (payment && payment.status !== PaymentStatus.PAID) {
                paymentEvent.payment = payment._id;
                payment.transitionTo(PaymentStatus.FAILED);
                payment.failureReason = paymentEntity.error_description || "Payment failed at gateway";
                await payment.save();
                logger.info(`❌ [Webhook] Marked payment for order "${paymentEntity.order_id}" as FAILED.`);
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
                logger.info(`💸 [Webhook] Updated refund status for payment "${payment._id}".`);
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
    );
  }
}

export default WebhookService;

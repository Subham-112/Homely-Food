import cron from "node-cron";
import { Payment } from "../models/payment.model";
import Cart from "../models/cart.model";
import { OrderService } from "../modules/order/order.service";
import razorpayService from "../services/razorpay/razorpay.service";
import { CartStatus, PaymentGateway, PaymentStatus, CoinTransactionType } from "../common/enum";
import { getIO } from "../socket/socketService";
import { CoinService } from "../modules/coin/coin.service";
import DistributedLockService from "../services/lock/distributedLock.service";
import { logger } from "../config/logger";

/**
 * Reconciles stuck pending payments against the Razorpay Gateway API.
 */
export const reconcilePaymentsJob = async (): Promise<void> => {
  const globalLockKey = "job_reconcile_payments_lock";

  try {
    // Acquire a lock so multiple server replicas don't execute the job concurrently
    const lockToken = await DistributedLockService.acquireLock(globalLockKey, 120);
    if (!lockToken) {
      logger.info("ℹ️ Payment reconciliation job already running on another instance, skipping.");
      return;
    }

    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      // Find all payments stuck in non-terminal states older than 5 minutes
      const pendingPayments = await Payment.find({
        gateway: PaymentGateway.RAZORPAY,
        status: {
          $in: [PaymentStatus.CREATED, PaymentStatus.PENDING, PaymentStatus.ATTEMPTED],
        },
        createdAt: { $lte: fiveMinutesAgo, $gte: twoDaysAgo },
      }).limit(50);

      if (pendingPayments.length === 0) {
        return;
      }

      logger.info(`🔍 Starting reconciliation for ${pendingPayments.length} pending payment records...`);

      for (const payment of pendingPayments) {
        const itemLockKey = `reconcile_tx_${payment._id}`;

        try {
          await DistributedLockService.withLock(itemLockKey, 30, async () => {
            // Re-fetch payment in case it was updated concurrently by webhook or verify API
            const currentPayment = await Payment.findById(payment._id);
            if (
              !currentPayment ||
              [PaymentStatus.PAID, PaymentStatus.FAILED, PaymentStatus.EXPIRED, PaymentStatus.REFUNDED].includes(
                currentPayment.status
              )
            ) {
              return;
            }

            if (
              !currentPayment.gatewayOrderId ||
              currentPayment.gatewayOrderId.startsWith("COD-") ||
              currentPayment.gatewayOrderId.startsWith("MANUAL-")
            ) {
              if (currentPayment.expiresAt && currentPayment.expiresAt < now) {
                currentPayment.transitionTo(PaymentStatus.EXPIRED);
                await currentPayment.save();
              }
              return;
            }

            // 1. Query Razorpay Gateway for authoritative payments status on this order
            let gatewayPayments: any = null;
            let razorpayOrder: any = null;

            try {
              [gatewayPayments, razorpayOrder] = await Promise.all([
                razorpayService.fetchOrderPayments(currentPayment.gatewayOrderId),
                razorpayService.fetchOrder(currentPayment.gatewayOrderId).catch(() => null),
              ]);
            } catch (gwErr: any) {
              logger.warn(
                `Gateway lookup failed for order ${currentPayment.gatewayOrderId}: ${gwErr.message}`
              );
              return;
            }

            const items: any[] = gatewayPayments?.items || [];

            // 2. Check for any successful payment attempt (captured or authorized)
            const successfulPayment = items.find(
              (p) => p.status === "captured" || p.status === "authorized"
            );

            if (successfulPayment) {
              logger.info(
                `✅ [Reconciliation] Found successful payment "${successfulPayment.id}" (status: ${successfulPayment.status}) for gateway order "${currentPayment.gatewayOrderId}". Transitioning to PAID.`
              );

              currentPayment.gatewayPaymentId = successfulPayment.id;
              currentPayment.transitionTo(PaymentStatus.PAID);
              currentPayment.capturedAt = new Date(
                successfulPayment.created_at ? successfulPayment.created_at * 1000 : Date.now()
              );
              if (successfulPayment.method) {
                currentPayment.paymentMode = successfulPayment.method.toUpperCase();
              }
              currentPayment.details = razorpayService.extractPaymentDetails(successfulPayment);

              // If order was not yet created, create & fulfill it now
              if (!currentPayment.order && currentPayment.draftPayload) {
                const draftPayload = currentPayment.draftPayload as any;
                const createdOrder = await OrderService.create(
                  {
                    ...draftPayload,
                    paymentPreference: "ONLINE",
                    payment: {
                      method: currentPayment.method,
                      status: PaymentStatus.PAID,
                      transactionId: successfulPayment.id,
                    },
                  },
                  currentPayment._id
                );

                currentPayment.order = createdOrder._id as any;
                currentPayment.draftPayload = undefined;

                const targetUserId = currentPayment.user || draftPayload.userId;
                if (targetUserId) {
                  try {
                    const activeCart = await Cart.findOne({ user: targetUserId, status: CartStatus.ACTIVE });
                    if (activeCart) {
                      if (
                        activeCart.total?.discountType === "coins" &&
                        activeCart.total?.coinsUsed &&
                        activeCart.total.coinsUsed > 0
                      ) {
                        activeCart.total.coinStatus = "converted";
                        try {
                          await CoinService.debitWallet(targetUserId.toString(), activeCart.total.coinsUsed, {
                            type: CoinTransactionType.SPENT,
                            reason: "Applied for Discount (Reconciliation)",
                            orderId: createdOrder._id.toString(),
                          });
                        } catch (coinErr) {
                          logger.error("Failed to debit coin wallet during payment reconciliation:", coinErr);
                        }
                      }
                      activeCart.status = CartStatus.COMPLETED;
                      await activeCart.save();
                    }
                  } catch (cErr) {
                    logger.error("Failed updating cart status in payment reconciliation:", cErr);
                  }
                }

                logger.info(
                  `📦 [Reconciliation] Successfully fulfilled Order ${createdOrder.orderNumber || createdOrder._id} for reconciled payment.`
                );
              }

              await currentPayment.save();

              // Emit Socket notifications
              try {
                const io = getIO();
                io.to("admin_room").emit("payment:updated", { payment: currentPayment });
                if (currentPayment.order) {
                  io.to(`order_${String(currentPayment.order)}`).emit("payment:updated", {
                    payment: currentPayment,
                  });
                }
              } catch (sockErr) {
                logger.error("Failed emitting socket event from reconciliation:", sockErr);
              }
              return;
            }

            // 3. Grace Period Check: If payment might still be processing on bank side
            const gracePeriodMs = 5 * 60 * 1000; // 5 minute grace buffer after expiry
            const isWithinGracePeriod = currentPayment.expiresAt
              ? now.getTime() < currentPayment.expiresAt.getTime() + gracePeriodMs
              : false;

            const hasPendingAttempt = items.some(
              (p) => p.status === "created" || p.status === "pending"
            );

            if (razorpayOrder?.status === "attempted" || hasPendingAttempt || isWithinGracePeriod) {
              logger.info(
                `⏳ [Reconciliation] Payment "${currentPayment.gatewayOrderId}" is pending/processing at gateway (attempts: ${razorpayOrder?.attempts || items.length}). Skipping expiration.`
              );
              return;
            }

            // 4. If all payment attempts explicitly failed and session has expired
            if (items.length > 0 && items.every((i) => i.status === "failed")) {
              logger.info(
                `❌ [Reconciliation] All payment attempts failed for "${currentPayment.gatewayOrderId}". Marking as FAILED.`
              );
              currentPayment.transitionTo(PaymentStatus.FAILED);
              currentPayment.failureReason = items[0]?.error_description || "Payment failed at gateway";
              await currentPayment.save();
              return;
            }

            // 5. Expiry Check: Only expire if no successful payments exist and session is fully past expiry + grace period
            if (currentPayment.expiresAt && now.getTime() >= currentPayment.expiresAt.getTime() + gracePeriodMs) {
              logger.info(
                `⏰ [Reconciliation] Checkout session "${currentPayment.gatewayOrderId}" expired with no successful payments. Marking EXPIRED.`
              );
              currentPayment.transitionTo(PaymentStatus.EXPIRED);
              await currentPayment.save();
            }
          });
        } catch (itemErr) {
          logger.error(`Error reconciling payment ${payment._id}:`, itemErr);
        }
      }
    } finally {
      await DistributedLockService.releaseLock(globalLockKey, lockToken);
    }
  } catch (error) {
    logger.error("Error in reconcilePaymentsJob execution:", error);
  }
};

/**
 * Initializes the automated payment reconciliation background cron job.
 * Runs every 5 minutes.
 */
export const initPaymentReconciliationJob = (): void => {
  cron.schedule("*/5 * * * *", async () => {
    logger.info("⏰ Running automated payment reconciliation cron worker...");
    await reconcilePaymentsJob();
  });
  logger.info("📅 Automated payment reconciliation job scheduled (every 15 minutes).");
};

export default initPaymentReconciliationJob;

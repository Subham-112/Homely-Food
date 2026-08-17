import { Payment } from "../models/payment.model";
import { PaymentStatus } from "../common/enum";
import { logger } from "../config/logger";

export const expirePendingPaymentsJob = async () => {
  try {
    const now = new Date();
    const result = await Payment.updateMany(
      {
        order: null,
        status: { $in: [PaymentStatus.CREATED, PaymentStatus.ATTEMPTED] },
        expiresAt: { $lt: now },
      },
      {
        $set: { status: PaymentStatus.EXPIRED },
      }
    );

    if (result.modifiedCount > 0) {
      logger.info(`⏰ Sweeper expired ${result.modifiedCount} stale pending checkout sessions.`);
    }
  } catch (error) {
    logger.error("Error running expirePendingPaymentsJob:", error);
  }
};

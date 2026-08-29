import { PaymentStatus } from "../common/enum";
import ApiError from "./ApiError";

/**
 * Payment State Machine
 * Defines permissible state transitions for payments to preserve financial data integrity.
 */
export const PaymentTransitions: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.CREATED]: [
    PaymentStatus.CREATED,
    PaymentStatus.PENDING,
    PaymentStatus.ATTEMPTED,
    PaymentStatus.PAID,
    PaymentStatus.FAILED,
    PaymentStatus.EXPIRED,
  ],
  [PaymentStatus.PENDING]: [
    PaymentStatus.PENDING,
    PaymentStatus.ATTEMPTED,
    PaymentStatus.PAID,
    PaymentStatus.FAILED,
    PaymentStatus.EXPIRED,
  ],
  [PaymentStatus.ATTEMPTED]: [
    PaymentStatus.ATTEMPTED,
    PaymentStatus.PAID,
    PaymentStatus.FAILED,
    PaymentStatus.EXPIRED,
  ],
  [PaymentStatus.UNPAID]: [
    PaymentStatus.UNPAID,
    PaymentStatus.PAID,
    PaymentStatus.FAILED,
    PaymentStatus.EXPIRED,
  ],
  [PaymentStatus.PAID]: [
    PaymentStatus.PAID,
    PaymentStatus.PARTIALLY_REFUNDED,
    PaymentStatus.REFUNDED,
  ],
  [PaymentStatus.PARTIALLY_REFUNDED]: [
    PaymentStatus.PARTIALLY_REFUNDED,
    PaymentStatus.REFUNDED,
  ],
  [PaymentStatus.FAILED]: [PaymentStatus.FAILED],
  [PaymentStatus.EXPIRED]: [PaymentStatus.EXPIRED],
  [PaymentStatus.REFUNDED]: [PaymentStatus.REFUNDED],
};

/**
 * Checks if a transition from fromStatus to toStatus is permissible.
 */
export const canTransitionPayment = (
  fromStatus: PaymentStatus,
  toStatus: PaymentStatus
): boolean => {
  const allowed = PaymentTransitions[fromStatus];
  if (!allowed) return false;
  return allowed.includes(toStatus);
};

/**
 * Validates a payment status transition and throws an ApiError if invalid.
 */
export const validatePaymentTransition = (
  fromStatus: PaymentStatus,
  toStatus: PaymentStatus,
  paymentId?: string
): void => {
  if (!canTransitionPayment(fromStatus, toStatus)) {
    const identifier = paymentId ? ` for payment ${paymentId}` : "";
    throw new ApiError(
      400,
      `Invalid payment state transition${identifier}: cannot transition from '${fromStatus}' to '${toStatus}'.`
    );
  }
};

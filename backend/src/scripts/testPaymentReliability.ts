import { toPaise, toRupees, safeAddPaise, safeSubtractPaise } from "../utils/currencyHelper";
import { canTransitionPayment, validatePaymentTransition } from "../utils/paymentStateMachine";
import { computePayloadFingerprint } from "../middlewares/idempotencyMiddleware";
import { PaymentStatus } from "../common/enum";

const runTests = () => {
  console.log("🚀 Starting Payment Reliability Fundamentals Verification...\n");

  // 1. Integer Currency Conversion Tests
  console.log("--- 1. Testing Integer Monetary Arithmetic ---");
  const testVal1 = 19.99;
  const paiseVal1 = toPaise(testVal1);
  console.assert(paiseVal1 === 1999, `Expected 1999 paise, got ${paiseVal1}`);
  console.assert(toRupees(paiseVal1) === 19.99, `Expected 19.99 rupees, got ${toRupees(paiseVal1)}`);

  const sumPaise = safeAddPaise(toPaise(10.5), toPaise(20.35), toPaise(0.15));
  console.assert(sumPaise === 3100, `Expected 3100 paise, got ${sumPaise}`);
  console.assert(toRupees(sumPaise) === 31.0, `Expected 31.0 rupees, got ${toRupees(sumPaise)}`);

  const subPaise = safeSubtractPaise(toPaise(50.0), toPaise(12.75));
  console.assert(subPaise === 3725, `Expected 3725 paise, got ${subPaise}`);
  console.assert(toRupees(subPaise) === 37.25, `Expected 37.25 rupees, got ${toRupees(subPaise)}`);
  console.log("✅ Integer currency tests passed!\n");

  // 2. State Machine Transition Tests
  console.log("--- 2. Testing Payment State Machine ---");
  console.assert(canTransitionPayment(PaymentStatus.CREATED, PaymentStatus.PAID) === true, "CREATED -> PAID should be allowed");
  console.assert(canTransitionPayment(PaymentStatus.CREATED, PaymentStatus.FAILED) === true, "CREATED -> FAILED should be allowed");
  console.assert(canTransitionPayment(PaymentStatus.CREATED, PaymentStatus.EXPIRED) === true, "CREATED -> EXPIRED should be allowed");
  console.assert(canTransitionPayment(PaymentStatus.PAID, PaymentStatus.REFUNDED) === true, "PAID -> REFUNDED should be allowed");
  console.assert(canTransitionPayment(PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED) === true, "PAID -> PARTIALLY_REFUNDED should be allowed");
  
  // Forbidden transitions
  console.assert(canTransitionPayment(PaymentStatus.FAILED, PaymentStatus.PAID) === false, "FAILED -> PAID must be forbidden");
  console.assert(canTransitionPayment(PaymentStatus.EXPIRED, PaymentStatus.PAID) === false, "EXPIRED -> PAID must be forbidden");
  console.assert(canTransitionPayment(PaymentStatus.REFUNDED, PaymentStatus.PAID) === false, "REFUNDED -> PAID must be forbidden");
  console.assert(canTransitionPayment(PaymentStatus.PAID, PaymentStatus.CREATED) === false, "PAID -> CREATED must be forbidden");
  console.assert(canTransitionPayment(PaymentStatus.PAID, PaymentStatus.PENDING) === false, "PAID -> PENDING must be forbidden");

  let threwError = false;
  try {
    validatePaymentTransition(PaymentStatus.FAILED, PaymentStatus.PAID, "test-pay-123");
  } catch (err: any) {
    threwError = true;
    console.assert(err.statusCode === 400, "Should throw 400 ApiError on invalid transition");
  }
  console.assert(threwError === true, "Expected invalid state transition to throw an error");
  console.log("✅ State machine tests passed!\n");

  // 3. Payload Fingerprinting Tests
  console.log("--- 3. Testing Payload Fingerprinting ---");
  const payloadA = { amount: 1500, items: [{ id: "1", qty: 2 }], notes: "urgent" };
  const payloadB = { items: [{ id: "1", qty: 2 }], notes: "urgent", amount: 1500 }; // different key ordering
  const payloadC = { amount: 2000, items: [{ id: "1", qty: 2 }], notes: "urgent" }; // different amount

  const hashA = computePayloadFingerprint(payloadA);
  const hashB = computePayloadFingerprint(payloadB);
  const hashC = computePayloadFingerprint(payloadC);

  console.assert(hashA === hashB, `Expected identical hashes for payloadA and payloadB, got ${hashA} vs ${hashB}`);
  console.assert(hashA !== hashC, `Expected different hashes for payloadA and payloadC`);
  console.log("✅ Payload fingerprinting tests passed!\n");

  console.log("🎉 ALL PAYMENT RELIABILITY FUNDAMENTALS TESTS PASSED SUCCESSFULLY!");
};

runTests();

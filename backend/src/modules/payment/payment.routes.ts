import { Router } from "express";
import { PaymentController } from "./payment.controller";
import { userAccess, adminAccess } from "../../middlewares/authMiddleware";
import { idempotencyMiddleware } from "../../middlewares/idempotencyMiddleware";

const router = Router();

// User facing routes
router.post("/verify", ...userAccess, idempotencyMiddleware(), PaymentController.verifyPayment);
router.get("/order/:orderId", ...userAccess, PaymentController.getPaymentByOrder);
router.get("/my-payments", ...userAccess, PaymentController.getMyPayments);

// Admin routes
router.get("/admin", ...adminAccess, PaymentController.getAdminPayments);
router.get("/admin/analytics", ...adminAccess, PaymentController.getAdminAnalytics);
router.post("/admin/:id/refund", ...adminAccess, idempotencyMiddleware(), PaymentController.initiateRefund);

export default router;

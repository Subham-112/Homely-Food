import { Router } from "express";
import { OrderController } from "./order.controller";
import { userAccess, adminAccess } from "../../middlewares/authMiddleware";
import { idempotencyMiddleware } from "../../middlewares/idempotencyMiddleware";

const router = Router();

// Order creation endpoint (Token required, with Idempotency support)
router.post("/", ...userAccess, idempotencyMiddleware(), OrderController.create);

// Admin-only management & dashboard stats
router.get("/", ...adminAccess, OrderController.getAll);
router.get("/stats", ...adminAccess, OrderController.getStats);

// User-specific orders list (Token required)
router.get("/my-orders", ...userAccess, OrderController.getMyOrders);

// Get order details by ID (Token required)
router.get("/:id", ...userAccess, OrderController.getById);

// Admin-only status updates
router.patch("/:id/status", ...adminAccess, OrderController.updateStatus);

export default router;

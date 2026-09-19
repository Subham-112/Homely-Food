import { Router } from "express";
import { requireInternalAuth } from "../../middlewares/internalAuth.middleware";
import {
  getInternalOrders,
  getInternalOrdersStats,
  getInternalOrderById,
} from "./internalOrders.controller";

const router = Router();

// Secure all internal order endpoints with the middleware
router.use(requireInternalAuth);

router.get("/", getInternalOrders);
router.get("/stats", getInternalOrdersStats);
router.get("/summary", getInternalOrdersStats);
router.get("/:orderNumber", getInternalOrderById);

export default router;

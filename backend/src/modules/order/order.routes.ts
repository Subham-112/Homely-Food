import { Router } from "express";
import { OrderController } from "./order.controller";

const router = Router();

router.post("/", OrderController.create);
router.get("/", OrderController.getAll);
router.get("/stats", OrderController.getStats);
router.get("/:id", OrderController.getById);
router.patch("/:id/status", OrderController.updateStatus);

export default router;

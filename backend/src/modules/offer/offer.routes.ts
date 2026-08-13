import { Router } from "express";
import { OfferController } from "./offer.controller";
import { adminAccess, authenticateToken } from "../../middlewares/authMiddleware";

const router = Router();

// Token required to view active offers
router.get("/", authenticateToken, OfferController.getAll);
router.get("/:id", authenticateToken, OfferController.getById);

// Admin-only management endpoints
router.post("/", ...adminAccess, OfferController.create);
router.put("/:id", ...adminAccess, OfferController.update);
router.patch("/:id/toggle-active", ...adminAccess, OfferController.toggleActive);
router.post("/:id/repost", ...adminAccess, OfferController.repost);
router.delete("/:id", ...adminAccess, OfferController.delete);

export default router;

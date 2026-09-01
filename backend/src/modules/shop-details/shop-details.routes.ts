import { Router } from "express";
import { ShopDetailsController } from "./shop-details.controller";
import { authenticateToken, authorize } from "../../middlewares/authMiddleware";

const router = Router();

// Public Endpoints
router.get("/", ShopDetailsController.getDetails);
router.get("/check-pincode/:pincode", ShopDetailsController.checkPincode);

// Admin-Protected Endpoints
router.put("/", authenticateToken, authorize("admin"), ShopDetailsController.updateDetails);
router.patch("/toggle-status", authenticateToken, authorize("admin"), ShopDetailsController.toggleStatus);
router.patch("/toggle-delivery-status", authenticateToken, authorize("admin"), ShopDetailsController.toggleDeliveryStatus);

export default router;

import { Router } from "express";
import { VariantController } from "./variants.controller";
import { adminAccess, authenticateToken } from "../../middlewares/authMiddleware";

const router = Router();

// Token required to view variants
router.get("/menu-item/:menuItemId", authenticateToken, VariantController.getByMenuItem);
router.get("/:id", authenticateToken, VariantController.getById);

// Admin management endpoints
router.post("/", ...adminAccess, VariantController.create);
router.put("/:id", ...adminAccess, VariantController.update);
router.patch("/:id/status", ...adminAccess, VariantController.toggleStatus);
router.delete("/:id", ...adminAccess, VariantController.delete);

export default router;

import { Router } from "express";
import { VariantController } from "./variants.controller";
import { adminAccess } from "../../middlewares/authMiddleware";

const router = Router();

// Public / User view variants
router.get("/menu-item/:menuItemId", VariantController.getByMenuItem);
router.get("/:id", VariantController.getById);

// Admin management endpoints
router.post("/", ...adminAccess, VariantController.create);
router.put("/:id", ...adminAccess, VariantController.update);
router.patch("/:id/status", ...adminAccess, VariantController.toggleStatus);
router.delete("/:id", ...adminAccess, VariantController.delete);

export default router;

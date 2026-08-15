import { Router } from "express";
import { MenuItemController } from "./menu-items.controller";
import { adminAccess, authenticateToken } from "../../middlewares/authMiddleware";
import { uploadImage } from "../../middlewares/uploadMiddleware";

const router = Router();

// Public routes - no auth required to browse menu
router.get("/", MenuItemController.getAll);
router.get("/order-list", authenticateToken, MenuItemController.getOrderList);
router.get("/:id", MenuItemController.getById);

// Admin-only management endpoints
router.get("/admin/all", ...adminAccess, MenuItemController.getAllForAdmin);
router.post("/", ...adminAccess, uploadImage({ folder: "menu-items", multiple: false }), MenuItemController.create);
router.put("/:id", ...adminAccess, uploadImage({ folder: "menu-items", multiple: false }), MenuItemController.update);
router.patch("/:id/status", ...adminAccess, MenuItemController.toggleStatus);
router.delete("/:id", ...adminAccess, MenuItemController.delete);

export default router;

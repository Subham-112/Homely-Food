import { Router } from "express";
import { MenuItemController } from "./menu-items.controller";
import { adminAccess } from "../../middlewares/authMiddleware";
import { uploadImage } from "../../middlewares/uploadMiddleware";

const router = Router();

// Public / User access to view menu items
router.get("/", MenuItemController.getAll);
router.get("/order-list", MenuItemController.getOrderList);
router.get("/:id", MenuItemController.getById);

// Admin-only management endpoints
router.post("/", ...adminAccess, uploadImage({ folder: "menu-items", multiple: false }), MenuItemController.create);
router.put("/:id", ...adminAccess, uploadImage({ folder: "menu-items", multiple: false }), MenuItemController.update);
router.patch("/:id/status", ...adminAccess, MenuItemController.toggleStatus);
router.delete("/:id", ...adminAccess, MenuItemController.delete);

export default router;

import { Router } from "express";
import { CategoryController } from "./category.controller";
import { adminAccess, authenticateToken } from "../../middlewares/authMiddleware";

const router = Router();

// Token required for viewing category lists
router.get("/list", CategoryController.getActiveCategoryList);
router.get("/active", authenticateToken, CategoryController.getActiveCategories);
router.get("/:id", authenticateToken, CategoryController.getById);

// Admin access: Create, update, toggle status, soft-delete, and get all
router.get("/admin/all", ...adminAccess, CategoryController.getAllForAdmin);
router.post("/", ...adminAccess, CategoryController.create);
router.put("/:id", ...adminAccess, CategoryController.update);
router.patch("/:id/status", ...adminAccess, CategoryController.toggleStatus);
router.delete("/:id", ...adminAccess, CategoryController.delete);

export default router;

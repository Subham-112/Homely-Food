import { Router } from "express";
import { CategoryController } from "./category.controller";
import { adminAccess } from "../../middlewares/authMiddleware";
import { uploadImage } from "../../middlewares/uploadMiddleware";

const router = Router();

// User / Public access: Get active non-deleted categories list (id and name only)
router.get("/list", CategoryController.getActiveCategoryList);

// User access: Get active non-deleted categories with full details
router.get("/active", CategoryController.getActiveCategories);

// General/Public/User access: get by id (if active or inactive non-deleted)
router.get("/:id", CategoryController.getById);

// Admin access: Create, update, toggle status, soft-delete, and get all
router.get("/admin/all", ...adminAccess, CategoryController.getAllForAdmin);
router.post("/", ...adminAccess, uploadImage({ folder: "categories", multiple: false }), CategoryController.create);
router.put("/:id", ...adminAccess, uploadImage({ folder: "categories", multiple: false }), CategoryController.update);
router.patch("/:id/status", ...adminAccess, CategoryController.toggleStatus);
router.delete("/:id", ...adminAccess, CategoryController.delete);

export default router;

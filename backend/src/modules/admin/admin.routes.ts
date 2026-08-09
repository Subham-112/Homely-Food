import { Router } from "express";
import { AdminController } from "./admin.controller";
import { adminAccess } from "../../middlewares/authMiddleware";

const router = Router();

router.post("/register", AdminController.register);
router.post("/login", AdminController.login);
router.post("/logout", ...adminAccess, AdminController.logout);
router.get("/profile", ...adminAccess, AdminController.getProfile);

export default router;

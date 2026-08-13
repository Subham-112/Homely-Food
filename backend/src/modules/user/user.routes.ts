import { Router } from "express";
import { UserController } from "./user.controller";
import { adminAccess, userAccess } from "../../middlewares/authMiddleware";

const router = Router();

router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.get("/search-by-phone", ...adminAccess, UserController.searchByPhone);
router.post("/logout", ...userAccess, UserController.logout);
router.get("/profile", ...userAccess, UserController.getProfile);
router.put("/profile", ...userAccess, UserController.updateProfile);

export default router;

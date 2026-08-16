import { Router } from "express";
import { UserController } from "./user.controller";
import { adminAccess, userAccess } from "../../middlewares/authMiddleware";

const router = Router();

router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.post("/logout", ...userAccess, UserController.logout);

router.get("/search-by-phone", ...adminAccess, UserController.searchByPhone);
router.get("/profile", ...userAccess, UserController.getProfile);
router.get("/is-phone-exists", UserController.isPhoneExists);
router.post("/reset-password", UserController.resetPassword);

router.put("/profile", ...userAccess, UserController.updateProfile);

export default router;

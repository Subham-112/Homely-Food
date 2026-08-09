import { Router } from "express";
import userRoutes from "../modules/user/user.routes";
import adminRoutes from "../modules/admin/admin.routes";

const router = Router();

router.use("/user", userRoutes);
router.use("/admin", adminRoutes);

export default router;

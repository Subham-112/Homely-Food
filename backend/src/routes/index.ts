import { Router } from "express";
import userRoutes from "../modules/user/user.routes";
import adminRoutes from "../modules/admin/admin.routes";
import categoryRoutes from "../modules/category/category.routes";
import menuItemRoutes from "../modules/menu-items/menu-items.routes";
import variantRoutes from "../modules/variants/variants.routes";
import orderRoutes from "../modules/order/order.routes";

const router = Router();

router.use("/user", userRoutes);
router.use("/admin", adminRoutes);
router.use("/category", categoryRoutes);
router.use("/menu-item", menuItemRoutes);
router.use("/variant", variantRoutes);
router.use("/order", orderRoutes);

export default router;

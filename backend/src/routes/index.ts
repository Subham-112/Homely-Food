import { Router } from "express";
import userRoutes from "../modules/user/user.routes";
import adminRoutes from "../modules/admin/admin.routes";
import categoryRoutes from "../modules/category/category.routes";
import menuItemRoutes from "../modules/menu-items/menu-items.routes";
import variantRoutes from "../modules/variants/variants.routes";
import orderRoutes from "../modules/order/order.routes";
import cartRoutes from "../modules/cart/cart.routes";
import customerRoutes from "../modules/customer/customer.routes";
import offerRoutes from "../modules/offer/offer.routes";
import paymentRoutes from "../modules/payment/payment.routes";
import webhookRoutes from "../modules/webhook/webhook.routes";

const router = Router();

router.use("/user", userRoutes);
router.use("/admin", adminRoutes);
router.use("/category", categoryRoutes);
router.use("/menu-item", menuItemRoutes);
router.use("/variant", variantRoutes);
router.use("/order", orderRoutes);
router.use("/cart", cartRoutes);
router.use("/customer", customerRoutes);
router.use("/offer", offerRoutes);
router.use("/payment", paymentRoutes);
router.use("/webhook", webhookRoutes);

export default router;

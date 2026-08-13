import { Router } from "express";
import { CartController } from "./cart.controller";
import { userAccess } from "../../middlewares/authMiddleware";

const router = Router();

router.get("/", ...userAccess, CartController.getCart);
router.post("/", ...userAccess, CartController.syncCart);
router.post("/apply-offer", ...userAccess, CartController.applyOffer);
router.post("/remove-offer", ...userAccess, CartController.removeOffer);
router.post("/checkout", ...userAccess, CartController.checkout);
router.delete("/", ...userAccess, CartController.clearCart);

export default router;

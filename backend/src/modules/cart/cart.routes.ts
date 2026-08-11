import { Router } from "express";
import { CartController } from "./cart.controller";
import { userAccess } from "../../middlewares/authMiddleware";

const router = Router();

router.get("/", ...userAccess, CartController.getCart);
router.post("/", ...userAccess, CartController.syncCart);
router.delete("/", ...userAccess, CartController.clearCart);

export default router;

import { Router } from "express";
import { CustomerController } from "./customer.controller";
import { adminAccess } from "../../middlewares/authMiddleware";

const router = Router();

// Admin-only customer directory
router.get("/", ...adminAccess, CustomerController.getAll);

export default router;

import { Router } from "express";
import { CustomerController } from "./customer.controller";
import { CustomerGroupController } from "./customerGroup.controller";
import { adminAccess } from "../../middlewares/authMiddleware";

const router = Router();

// Customer Directory (Admin only)
router.get("/", ...adminAccess, CustomerController.getAll);

// Customer Group Management (Admin only)
router.get("/groups", ...adminAccess, CustomerGroupController.getAll);
router.post("/groups", ...adminAccess, CustomerGroupController.create);
router.get("/groups/:id", ...adminAccess, CustomerGroupController.getById);
router.put("/groups/:id", ...adminAccess, CustomerGroupController.update);
router.delete("/groups/:id", ...adminAccess, CustomerGroupController.delete);
router.put("/groups/:id/discount", ...adminAccess, CustomerGroupController.updateDiscount);
router.post("/groups/:id/customers", ...adminAccess, CustomerGroupController.assignCustomers);

// Customer Perk / Group Lookup (Accessible to user/admin for checkout validation)
router.get("/perks/:customerIdOrPhone", CustomerGroupController.getPerk);

export default router;

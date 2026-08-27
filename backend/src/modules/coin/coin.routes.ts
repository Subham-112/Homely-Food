import { Router } from "express";
import { CoinController } from "./coin.controller";
import { userAccess, adminAccess } from "../../middlewares/authMiddleware";

const router = Router();

// User Routes
router.get("/wallet", userAccess, CoinController.getUserWallet);
router.get("/history", userAccess, CoinController.getUserHistory);
router.get("/config", CoinController.getAdminConfig);

// Admin Routes — Wallets & Analytics
router.get("/admin/wallets", adminAccess, CoinController.getAdminWallets);
router.post("/admin/grant", adminAccess, CoinController.adminGrantCoins);
router.get("/admin/analytics", adminAccess, CoinController.getAdminAnalytics);

// Admin Routes — Earning Rules / Tiers
router.get("/admin/rules", adminAccess, CoinController.getAdminRules);
router.post("/admin/rules", adminAccess, CoinController.createCoinRule);
router.put("/admin/rules/:id", adminAccess, CoinController.updateCoinRule);
router.patch("/admin/rules/:id/status", adminAccess, CoinController.toggleCoinRuleStatus);
router.delete("/admin/rules/:id", adminAccess, CoinController.deleteCoinRule);

// Admin Routes — Redemption / Deduction Rules
router.get("/admin/redemption-rules", adminAccess, CoinController.getAdminRedemptionRules);
router.post("/admin/redemption-rules", adminAccess, CoinController.createRedemptionRule);
router.put("/admin/redemption-rules/:id", adminAccess, CoinController.updateRedemptionRule);
router.patch("/admin/redemption-rules/:id/status", adminAccess, CoinController.toggleRedemptionRuleStatus);
router.delete("/admin/redemption-rules/:id", adminAccess, CoinController.deleteRedemptionRule);

// Admin Routes — Config
router.get("/admin/config", adminAccess, CoinController.getAdminConfig);
router.put("/admin/config", adminAccess, CoinController.updateAdminConfig);

export default router;

import { Router } from "express";
import { LeaderboardController } from "./leaderboard.controller";
import { adminAccess, optionalAuth } from "../../middlewares/authMiddleware";

const router = Router();

// Public / Customer Endpoints
router.get("/", optionalAuth, LeaderboardController.getCustomerLeaderboard);
router.get("/config", LeaderboardController.getPublicConfig);

// Admin Endpoints
router.get("/admin", ...adminAccess, LeaderboardController.getAdminLeaderboard);
router.put("/admin/config", ...adminAccess, LeaderboardController.updateConfig);
router.post("/admin/resolve-tie", ...adminAccess, LeaderboardController.resolveTie);
router.get("/admin/rewards", ...adminAccess, LeaderboardController.getRewardLogs);

export default router;

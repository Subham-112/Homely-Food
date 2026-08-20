import { Request, Response, NextFunction } from "express";
import { CoinService } from "./coin.service";
import { CoinRuleService } from "./coinRule.service";
import { CoinConfigService } from "./coinConfig.service";
import ApiResponse from "../../utils/ApiResponse";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";
import { adminGrantCoinsSchema, createCoinRuleSchema, updateCoinConfigSchema } from "./coin.schema";

export class CoinController {
  public static async getUserWallet(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const wallet = await CoinService.getOrCreateWallet(userId);
      return res.status(200).json(new ApiResponse(200, wallet, "User wallet fetched successfully."));
    } catch (error) {
      next(error);
    }
  }

  public static async getUserHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const data = await CoinService.getUserHistory(userId, page, limit);
      return res.status(200).json(new ApiResponse(200, data, "User coin history fetched successfully."));
    } catch (error) {
      next(error);
    }
  }

  public static async getAdminWallets(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const search = (req.query.search as string) || "";

      const data = await CoinService.getAdminWallets(search, page, limit);
      return res.status(200).json(new ApiResponse(200, data, "Admin wallets fetched successfully."));
    } catch (error) {
      next(error);
    }
  }

  public static async adminGrantCoins(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?._id;
      const validated = adminGrantCoinsSchema.parse(req.body);
      const result = await CoinService.adminGrantCoins(
        adminId!,
        validated.userIds,
        validated.amount,
        validated.reason
      );
      return res.status(200).json(new ApiResponse(200, result, "Coins granted successfully."));
    } catch (error) {
      next(error);
    }
  }

  public static async getAdminRules(req: Request, res: Response, next: NextFunction) {
    try {
      const rules = await CoinRuleService.getAllRules(true);
      return res.status(200).json(new ApiResponse(200, rules, "Tier rules fetched successfully."));
    } catch (error) {
      next(error);
    }
  }

  public static async createCoinRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?._id;
      const validated = createCoinRuleSchema.parse(req.body);
      const rule = await CoinRuleService.createRule(validated, adminId!);
      return res.status(201).json(new ApiResponse(201, rule, "Tier rule created successfully."));
    } catch (error) {
      next(error);
    }
  }

  public static async updateCoinRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const idStr = Array.isArray(id) ? id[0] : id;
      const adminId = req.user?._id;
      const rule = await CoinRuleService.updateRule(idStr, req.body, adminId!);
      return res.status(200).json(new ApiResponse(200, rule, "Tier rule updated successfully."));
    } catch (error) {
      next(error);
    }
  }

  public static async toggleCoinRuleStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const idStr = Array.isArray(id) ? id[0] : id;
      const adminId = req.user?._id;
      const rule = await CoinRuleService.toggleStatus(idStr, adminId!);
      return res.status(200).json(new ApiResponse(200, rule, "Tier rule status toggled successfully."));
    } catch (error) {
      next(error);
    }
  }

  public static async deleteCoinRule(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const idStr = Array.isArray(id) ? id[0] : id;
      await CoinRuleService.deleteRule(idStr);
      return res.status(200).json(new ApiResponse(200, null, "Tier rule deleted successfully."));
    } catch (error) {
      next(error);
    }
  }

  public static async getAdminConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await CoinConfigService.getConfig();
      return res.status(200).json(new ApiResponse(200, config, "Coin config fetched successfully."));
    } catch (error) {
      next(error);
    }
  }

  public static async updateAdminConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?._id;
      const validated = updateCoinConfigSchema.parse(req.body);
      const config = await CoinConfigService.updateConfig(validated, adminId);
      return res.status(200).json(new ApiResponse(200, config, "Coin config updated successfully."));
    } catch (error) {
      next(error);
    }
  }

  public static async getAdminAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await CoinService.getAdminAnalytics();
      return res.status(200).json(new ApiResponse(200, analytics, "Coin analytics fetched successfully."));
    } catch (error) {
      next(error);
    }
  }
}

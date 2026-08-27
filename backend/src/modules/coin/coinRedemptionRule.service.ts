import { CoinRedemptionRule, ICoinRedemptionRule } from "../../models/coinRedemptionRule.model";
import ApiError from "../../utils/ApiError";

export class CoinRedemptionRuleService {
  public static async seedDefaultRules(): Promise<void> {
    const count = await CoinRedemptionRule.countDocuments();
    if (count > 0) return;

    const defaultRules = [
      { label: "Orders ₹100+", minOrderAmount: 100, maxCoinsDeductible: 20, isActive: true },
      { label: "Orders ₹200+", minOrderAmount: 200, maxCoinsDeductible: 50, isActive: true },
      { label: "Orders ₹500+", minOrderAmount: 500, maxCoinsDeductible: 150, isActive: true },
    ];

    await CoinRedemptionRule.insertMany(defaultRules);
  }

  public static async getAllRules(includeInactive: boolean = false): Promise<ICoinRedemptionRule[]> {
    const filter: any = {};
    if (!includeInactive) filter.isActive = true;
    return CoinRedemptionRule.find(filter).sort({ minOrderAmount: 1 });
  }

  public static async resolveRedemptionRule(orderAmount: number): Promise<ICoinRedemptionRule | null> {
    const rules = await CoinRedemptionRule.find({ isActive: true }).sort({ minOrderAmount: -1 });
    for (const rule of rules) {
      if (orderAmount >= rule.minOrderAmount) {
        return rule;
      }
    }
    return null;
  }

  public static async getMinThreshold(): Promise<number | null> {
    const rules = await CoinRedemptionRule.find({ isActive: true }).sort({ minOrderAmount: 1 }).limit(1);
    if (rules.length > 0) {
      return rules[0].minOrderAmount;
    }
    return null;
  }

  public static async createRule(data: Partial<ICoinRedemptionRule>, adminId: string): Promise<ICoinRedemptionRule> {
    if (data.minOrderAmount === undefined || data.maxCoinsDeductible === undefined) {
      throw new ApiError(400, "minOrderAmount and maxCoinsDeductible are required.");
    }
    const existing = await CoinRedemptionRule.findOne({ minOrderAmount: data.minOrderAmount, isActive: true });
    if (existing) {
      throw new ApiError(400, `Active redemption rule with minOrderAmount ₹${data.minOrderAmount} already exists.`);
    }

    const label = data.label || `Orders ₹${data.minOrderAmount}+`;

    const rule = new CoinRedemptionRule({
      ...data,
      label,
      createdBy: adminId,
      updatedBy: adminId,
    });
    await rule.save();
    return rule;
  }

  public static async updateRule(id: string, data: Partial<ICoinRedemptionRule>, adminId: string): Promise<ICoinRedemptionRule> {
    const rule = await CoinRedemptionRule.findById(id);
    if (!rule) throw new ApiError(404, "Redemption rule not found.");

    if (data.label === undefined && data.minOrderAmount !== undefined) {
      data.label = `Orders ₹${data.minOrderAmount}+`;
    }

    Object.assign(rule, data, { updatedBy: adminId });
    await rule.save();
    return rule;
  }

  public static async toggleStatus(id: string, adminId: string): Promise<ICoinRedemptionRule> {
    const rule = await CoinRedemptionRule.findById(id);
    if (!rule) throw new ApiError(404, "Redemption rule not found.");

    rule.isActive = !rule.isActive;
    rule.updatedBy = adminId as any;
    await rule.save();
    return rule;
  }

  public static async deleteRule(id: string): Promise<void> {
    const rule = await CoinRedemptionRule.findById(id);
    if (!rule) throw new ApiError(404, "Redemption rule not found.");
    await (rule as any).delete();
  }
}

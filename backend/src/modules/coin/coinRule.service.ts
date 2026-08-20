import { CoinRule, ICoinRule } from "../../models/coinRule.model";
import ApiError from "../../utils/ApiError";

export class CoinRuleService {
  public static async seedDefaultRules(): Promise<void> {
    const count = await CoinRule.countDocuments();
    if (count > 0) return;

    const defaultRules = [
      { label: "Base Tier", minOrderAmount: 20, fixedCoins: 3, isBaseTier: true, repeatCapCoins: 3, isActive: true },
      { label: "Tier 1 (₹49+)", minOrderAmount: 49, fixedCoins: 5, isBaseTier: false, isActive: true },
      { label: "Tier 2 (₹99+)", minOrderAmount: 99, fixedCoins: 15, isBaseTier: false, isActive: true },
      { label: "Tier 3 (₹199+)", minOrderAmount: 199, fixedCoins: 50, isBaseTier: false, isActive: true },
    ];

    await CoinRule.insertMany(defaultRules);
  }

  public static async getAllRules(includeInactive: boolean = false): Promise<ICoinRule[]> {
    const filter: any = {};
    if (!includeInactive) filter.isActive = true;
    return CoinRule.find(filter).sort({ minOrderAmount: -1 });
  }

  public static async resolveTier(orderAmount: number): Promise<ICoinRule | null> {
    const rules = await CoinRule.find({ isActive: true }).sort({ minOrderAmount: -1 });
    for (const rule of rules) {
      if (orderAmount >= rule.minOrderAmount) {
        return rule;
      }
    }
    return rules.find((r) => r.isBaseTier) || null;
  }

  public static async createRule(data: Partial<ICoinRule>, adminId: string): Promise<ICoinRule> {
    if (data.minOrderAmount === undefined || data.fixedCoins === undefined) {
      throw new ApiError(400, "minOrderAmount and fixedCoins are required.");
    }
    const existing = await CoinRule.findOne({ minOrderAmount: data.minOrderAmount, isActive: true });
    if (existing) {
      throw new ApiError(400, `Active tier rule with minOrderAmount ${data.minOrderAmount} already exists.`);
    }

    const rule = new CoinRule({
      ...data,
      createdBy: adminId,
      updatedBy: adminId,
    });
    await rule.save();
    return rule;
  }

  public static async updateRule(id: string, data: Partial<ICoinRule>, adminId: string): Promise<ICoinRule> {
    const rule = await CoinRule.findById(id);
    if (!rule) throw new ApiError(404, "Tier rule not found.");

    Object.assign(rule, data, { updatedBy: adminId });
    await rule.save();
    return rule;
  }

  public static async toggleStatus(id: string, adminId: string): Promise<ICoinRule> {
    const rule = await CoinRule.findById(id);
    if (!rule) throw new ApiError(404, "Tier rule not found.");

    rule.isActive = !rule.isActive;
    rule.updatedBy = adminId as any;
    await rule.save();
    return rule;
  }

  public static async deleteRule(id: string): Promise<void> {
    const rule = await CoinRule.findById(id);
    if (!rule) throw new ApiError(404, "Tier rule not found.");
    await (rule as any).delete();
  }
}

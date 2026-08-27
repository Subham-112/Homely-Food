import { z } from "zod";

export const adminGrantCoinsSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1, "At least one userId is required."),
  amount: z.number().positive("Amount must be greater than zero."),
  reason: z.string().optional(),
});

export const createCoinRuleSchema = z.object({
  label: z.string().min(1, "Label is required."),
  minOrderAmount: z.number().min(0, "minOrderAmount cannot be negative."),
  fixedCoins: z.number().min(0, "fixedCoins cannot be negative."),
  isBaseTier: z.boolean().optional(),
  repeatCapCoins: z.number().min(0).optional(),
});

export const updateCoinConfigSchema = z.object({
  coinToRupeeRatio: z.number().positive().optional(),
  welcomeBonusCoins: z.number().min(0).optional(),
  expiryInactivityDays: z.number().min(1).optional(),
  extendExpiryOnEarn: z.boolean().optional(),
  isCoinSystemEnabled: z.boolean().optional(),
});

export const createCoinRedemptionRuleSchema = z.object({
  label: z.string().optional(),
  minOrderAmount: z.number().min(0, "minOrderAmount cannot be negative."),
  maxCoinsDeductible: z.number().min(1, "maxCoinsDeductible must be at least 1."),
  isActive: z.boolean().optional(),
});

export const updateCoinRedemptionRuleSchema = z.object({
  label: z.string().optional(),
  minOrderAmount: z.number().min(0, "minOrderAmount cannot be negative.").optional(),
  maxCoinsDeductible: z.number().min(1, "maxCoinsDeductible must be at least 1.").optional(),
  isActive: z.boolean().optional(),
});


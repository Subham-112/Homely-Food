import { Fetch, Post, Put } from "@/utils/api";

export interface LeaderboardRewardDetails {
  discountAmount?: number;
  minOrderAmount?: number;
  validityDays?: number;
  coinsAmount?: number;
  freeItemName?: string;
}

export interface LeaderboardRewardTier {
  rankPosition: number;
  title: string;
  badgeColor?: string;
  rewardType: "DISCOUNT_VOUCHER" | "COINS" | "FREE_ITEM";
  rewardDetails: LeaderboardRewardDetails;
}

export interface LeaderboardConfigData {
  _id?: string;
  isActive: boolean;
  rankingMetric: "TOTAL_SPENDING" | "ORDER_COUNT";
  positionMaintainDays: number;
  orderStreakDays: number;
  orderConcurrency: string;
  timezone: string;
  minEligibleOrderAmount: number;
  excludeCoinsUsed: boolean;
  excludeDeliveryCharges: boolean;
  publicTopCount: number;
  nameDisplayFormat: "INITIALS" | "FIRST_NAME_INITIAL";
  periodMode: "MONTHLY_ONLY" | "MULTI_PERIOD";
  rewardTiers: LeaderboardRewardTier[];
}

export interface LeaderboardUserItem {
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  rank: number;
  totalSpending: number;
  completedOrdersCount: number;
  totalCoinsEarned: number;
  consecutiveDaysAtCurrentRank: number;
  consecutiveOrderDays: number;
  gapToFirst: number;
  isTied: boolean;
  tiedCount?: number;
  tiedWithUserIds?: string[];
  isCurrentUser?: boolean;
  rewardStatus?: string;
}

export interface CustomerLeaderboardResponse {
  period: "weekly" | "monthly" | "all_time";
  periodKey: string;
  periodMode?: "MONTHLY_ONLY" | "MULTI_PERIOD";
  publicTopCount?: number;
  topLeaderboard: LeaderboardUserItem[];
  userProgress: LeaderboardUserItem | null;
}

export interface AdminLeaderboardResponse {
  period: "weekly" | "monthly" | "all_time";
  periodKey: string;
  totalParticipants: number;
  customers: LeaderboardUserItem[];
}

export interface LeaderboardRewardLogItem {
  _id: string;
  customerId: {
    _id: string;
    name: string;
    phone: string;
    email?: string;
  };
  rankPosition: number;
  period: string;
  periodKey: string;
  rewardType: "DISCOUNT_VOUCHER" | "COINS" | "FREE_ITEM";
  rewardPayload: {
    coins?: number;
    voucherCode?: string;
    discountAmount?: number;
    minOrderAmount?: number;
    validUntil?: string;
    freeItemName?: string;
  };
  adminDecisionNote?: string;
  claimedByCustomer: boolean;
  createdAt: string;
}

/**
 * Fetch Customer Leaderboard (Personalized perspective & privacy masking)
 */
export async function getCustomerLeaderboard(
  period: "weekly" | "monthly" | "all_time" = "weekly"
): Promise<CustomerLeaderboardResponse> {
  const res: any = await Fetch(`/api/leaderboard?period=${period}`);
  return res.data;
}

/**
 * Fetch public config / rules for perks modal
 */
export async function getLeaderboardConfig(): Promise<LeaderboardConfigData> {
  const res: any = await Fetch("/api/leaderboard/config");
  return res.data;
}

/**
 * Admin: Fetch full unmasked leaderboard
 */
export async function getAdminLeaderboard(
  period: "weekly" | "monthly" | "all_time" = "weekly"
): Promise<AdminLeaderboardResponse> {
  const res: any = await Fetch(`/api/leaderboard/admin?period=${period}`);
  return res.data;
}

/**
 * Admin: Update config rules & reward tiers
 */
export async function updateLeaderboardConfig(
  payload: Partial<LeaderboardConfigData>
): Promise<LeaderboardConfigData> {
  const res: any = await Put("/api/leaderboard/admin/config", payload);
  return res.data;
}

/**
 * Admin: Resolve tie decision
 */
export async function resolveLeaderboardTie(payload: {
  customerId: string;
  rankPosition: number;
  period: string;
  periodKey: string;
  rewardType: "DISCOUNT_VOUCHER" | "COINS" | "FREE_ITEM";
  rewardDetails?: LeaderboardRewardDetails;
  note?: string;
}): Promise<any> {
  const res: any = await Post("/api/leaderboard/admin/resolve-tie", payload);
  return res.data;
}

/**
 * Admin: Fetch reward distribution logs
 */
export async function getLeaderboardRewardLogs(): Promise<LeaderboardRewardLogItem[]> {
  const res: any = await Fetch("/api/leaderboard/admin/rewards");
  return res.data;
}

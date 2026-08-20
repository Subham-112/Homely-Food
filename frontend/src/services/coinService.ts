import { Fetch, Post, Put, Patch, Delete } from "@/utils/api";

export interface CoinWalletRecord {
  _id: string;
  user: any;
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  lifetimeExpired: number;
  achievedTierIds: string[];
  nextExpiryCheckAt?: string;
  lastCreditedAt?: string;
  lastDebitedAt?: string;
  isActive: boolean;
}

export interface CoinTransactionRecord {
  _id: string;
  user: string;
  type: string;
  direction: "CREDIT" | "DEBIT";
  amount: number;
  balanceAfter: number;
  order?: any;
  tier?: any;
  reason: string;
  createdAt: string;
}

export interface CoinRuleRecord {
  _id: string;
  label: string;
  minOrderAmount: number;
  fixedCoins: number;
  isBaseTier: boolean;
  repeatCapCoins?: number;
  isActive: boolean;
}

export interface CoinConfigRecord {
  _id: string;
  coinToRupeeRatio: number;
  welcomeBonusCoins: number;
  repeatRewardPercentMin: number;
  repeatRewardPercentMax: number;
  expiryInactivityDays: number;
  extendExpiryOnEarn: boolean;
  isCoinSystemEnabled: boolean;
}

export async function getPublicCoinConfig(): Promise<CoinConfigRecord> {
  const res: any = await Fetch("/api/coins/config");
  return res.data;
}

export async function getUserWallet(): Promise<CoinWalletRecord> {
  const res: any = await Fetch("/api/coins/wallet");
  return res.data;
}

export async function getUserCoinHistory(page: number = 1, limit: number = 10): Promise<{ transactions: CoinTransactionRecord[]; pagination: any }> {
  const res: any = await Fetch(`/api/coins/history?page=${page}&limit=${limit}`);
  return res.data;
}

export async function getAdminWallets(page: number = 1, limit: number = 10, search: string = ""): Promise<{ wallets: CoinWalletRecord[]; pagination: any }> {
  const res: any = await Fetch(`/api/coins/admin/wallets?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
  return res.data;
}

export async function adminGrantCoins(userIds: string[], amount: number, reason: string): Promise<any> {
  const res: any = await Post("/api/coins/admin/grant", { userIds, amount, reason });
  return res.data;
}

export async function getAdminCoinRules(): Promise<CoinRuleRecord[]> {
  const res: any = await Fetch("/api/coins/admin/rules");
  return res.data;
}

export async function createCoinRule(payload: Partial<CoinRuleRecord>): Promise<CoinRuleRecord> {
  const res: any = await Post("/api/coins/admin/rules", payload);
  return res.data;
}

export async function updateCoinRule(id: string, payload: Partial<CoinRuleRecord>): Promise<CoinRuleRecord> {
  const res: any = await Put(`/api/coins/admin/rules/${id}`, payload);
  return res.data;
}

export async function toggleCoinRuleStatus(id: string): Promise<CoinRuleRecord> {
  const res: any = await Patch(`/api/coins/admin/rules/${id}/status`, {});
  return res.data;
}

export async function deleteCoinRule(id: string): Promise<void> {
  await Delete(`/api/coins/admin/rules/${id}`);
}

export async function getAdminCoinConfig(): Promise<CoinConfigRecord> {
  const res: any = await Fetch("/api/coins/admin/config");
  return res.data;
}

export async function updateAdminCoinConfig(payload: Partial<CoinConfigRecord>): Promise<CoinConfigRecord> {
  const res: any = await Put("/api/coins/admin/config", payload);
  return res.data;
}

export async function getAdminCoinAnalytics(): Promise<any> {
  const res: any = await Fetch("/api/coins/admin/analytics");
  return res.data;
}

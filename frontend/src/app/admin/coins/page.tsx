"use client";

import React, { useState, useEffect } from "react";
import {
  Coins,
  RefreshCw,
  Gift,
  Sliders,
  Award,
  Users,
  Check,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Search,
  UserCheck,
  X,
  Loader2,
} from "lucide-react";
import AdminBottomNav from "@/components/AdminBottomNav";
import {
  getAdminCoinAnalytics,
  getAdminCoinConfig,
  getAdminCoinRules,
  getAdminRedemptionRules,
  getAdminWallets,
  adminGrantCoins,
  createCoinRule,
  updateCoinRule,
  toggleCoinRuleStatus,
  deleteCoinRule,
  createRedemptionRule,
  updateRedemptionRule,
  toggleRedemptionRuleStatus,
  deleteRedemptionRule,
  updateAdminCoinConfig,
  searchUsersByPhone,
  CoinRuleRecord,
  CoinRedemptionRuleRecord,
  CoinWalletRecord,
  CoinConfigRecord,
} from "@/services/coinService";
import { formatUTCToIST } from "@/utils/datetime";

export default function AdminCoinsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "rules" | "grant" | "config">("overview");
  const [analytics, setAnalytics] = useState<any>(null);
  const [rules, setRules] = useState<CoinRuleRecord[]>([]);
  const [redemptionRules, setRedemptionRules] = useState<CoinRedemptionRuleRecord[]>([]);
  const [wallets, setWallets] = useState<CoinWalletRecord[]>([]);
  const [configData, setConfigData] = useState<CoinConfigRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Grant Modal state
  const [selectedUsers, setSelectedUsers] = useState<Array<{ id: string; name: string; phone: string }>>([]);
  const [phoneSearchQuery, setPhoneSearchQuery] = useState<string>("");
  const [phoneSearchResults, setPhoneSearchResults] = useState<Array<{ id?: string; _id?: string; name: string; phone: string }>>([]);
  const [isSearchingPhone, setIsSearchingPhone] = useState<boolean>(false);
  const [grantAmount, setGrantAmount] = useState<number>(10);
  const [grantReason, setGrantReason] = useState<string>("");
  const [grantSubmitting, setGrantSubmitting] = useState<boolean>(false);
  const [grantMessage, setGrantMessage] = useState<string>("");

  // Earning Rule Form state
  const [showRuleModal, setShowRuleModal] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<CoinRuleRecord | null>(null);
  const [ruleLabel, setRuleLabel] = useState<string>("");
  const [ruleMinAmount, setRuleMinAmount] = useState<number>(49);
  const [ruleFixedCoins, setRuleFixedCoins] = useState<number>(5);

  // Redemption / Deduction Rule Form state
  const [showRedemptionModal, setShowRedemptionModal] = useState<boolean>(false);
  const [editingRedemptionRule, setEditingRedemptionRule] = useState<CoinRedemptionRuleRecord | null>(null);
  const [redemptionLabel, setRedemptionLabel] = useState<string>("");
  const [redemptionMinAmount, setRedemptionMinAmount] = useState<number>(100);
  const [redemptionMaxCoins, setRedemptionMaxCoins] = useState<number>(20);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, walletsRes] = await Promise.all([
        getAdminCoinAnalytics(),
        getAdminWallets(1, 20),
      ]);
      setAnalytics(analyticsRes);
      setWallets(walletsRes.wallets || []);
    } catch (err) {
      console.error("Failed to fetch overview coin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRulesData = async () => {
    setLoading(true);
    try {
      const [rulesRes, redemptionRes] = await Promise.all([
        getAdminCoinRules(),
        getAdminRedemptionRules(),
      ]);
      setRules(rulesRes);
      setRedemptionRules(redemptionRes);
    } catch (err) {
      console.error("Failed to fetch coin rules data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfigData = async () => {
    setLoading(true);
    try {
      const configRes = await getAdminCoinConfig();
      setConfigData(configRes);
    } catch (err) {
      console.error("Failed to fetch coin config:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveTabData = async (tabToFetch = activeTab) => {
    if (tabToFetch === "overview") {
      await fetchOverviewData();
    } else if (tabToFetch === "rules") {
      await fetchRulesData();
    } else if (tabToFetch === "config") {
      await fetchConfigData();
    } else if (tabToFetch === "grant") {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveTabData(activeTab);
  }, [activeTab]);

  const handleGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length === 0) {
      alert("Please search and select at least one user.");
      return;
    }
    if (grantAmount <= 0) {
      alert("Please enter a valid coin amount.");
      return;
    }

    setGrantSubmitting(true);
    setGrantMessage("");
    try {
      const uids = selectedUsers.map((u) => u.id);
      const res = await adminGrantCoins(uids, grantAmount, grantReason);
      setGrantMessage(`Successfully granted ${grantAmount} coins to ${res.succeeded?.length || 0} user(s).`);
      setSelectedUsers([]);
      setPhoneSearchQuery("");
      setGrantReason("");
    } catch (err: any) {
      setGrantMessage(err?.message || "Failed to grant coins.");
    } finally {
      setGrantSubmitting(false);
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await updateCoinRule(editingRule._id, {
          label: ruleLabel,
          minOrderAmount: ruleMinAmount,
          fixedCoins: ruleFixedCoins,
        });
      } else {
        await createCoinRule({
          label: ruleLabel,
          minOrderAmount: ruleMinAmount,
          fixedCoins: ruleFixedCoins,
        });
      }
      setShowRuleModal(false);
      setEditingRule(null);
      setRuleLabel("");
      fetchRulesData();
    } catch (err: any) {
      alert(err?.message || "Failed to save tier rule");
    }
  };

  const handleToggleRule = async (id: string) => {
    try {
      await toggleCoinRuleStatus(id);
      fetchRulesData();
    } catch (err) {
      console.error("Failed to toggle rule:", err);
    }
  };

  // Search by Phone handler with debouncing
  useEffect(() => {
    if (!phoneSearchQuery.trim()) {
      setPhoneSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingPhone(true);
      try {
        const results = await searchUsersByPhone(phoneSearchQuery.trim());
        setPhoneSearchResults(results);
      } catch (err) {
        console.error("Failed searching users by phone:", err);
      } finally {
        setIsSearchingPhone(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [phoneSearchQuery]);

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tier rule?")) return;
    try {
      await deleteCoinRule(id);
      fetchRulesData();
    } catch (err) {
      console.error("Failed to delete rule:", err);
    }
  };

  const handleSaveRedemptionRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRedemptionRule) {
        await updateRedemptionRule(editingRedemptionRule._id, {
          label: redemptionLabel,
          minOrderAmount: redemptionMinAmount,
          maxCoinsDeductible: redemptionMaxCoins,
        });
      } else {
        await createRedemptionRule({
          label: redemptionLabel,
          minOrderAmount: redemptionMinAmount,
          maxCoinsDeductible: redemptionMaxCoins,
        });
      }
      setShowRedemptionModal(false);
      setEditingRedemptionRule(null);
      setRedemptionLabel("");
      fetchRulesData();
    } catch (err: any) {
      alert(err?.message || "Failed to save redemption rule");
    }
  };

  const handleToggleRedemptionRule = async (id: string) => {
    try {
      await toggleRedemptionRuleStatus(id);
      fetchRulesData();
    } catch (err) {
      console.error("Failed to toggle redemption rule:", err);
    }
  };

  const handleDeleteRedemptionRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this redemption rule?")) return;
    try {
      await deleteRedemptionRule(id);
      fetchRulesData();
    } catch (err) {
      console.error("Failed to delete redemption rule:", err);
    }
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configData) return;
    try {
      await updateAdminCoinConfig(configData);
      alert("Global coin settings updated successfully!");
      fetchConfigData();
    } catch (err: any) {
      alert(err?.message || "Failed to update global config");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6ED] pb-36 sm:pb-32 p-3 sm:p-6 max-w-7xl w-full mx-auto flex flex-col gap-5 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E8E1D3] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Coins className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B251C] font-poppins">
              Homely Coins Management
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Gamification rules, global config, user wallets & manual grants
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchActiveTabData(activeTab)}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 bg-[#0B392B] hover:bg-[#07281E] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer disabled:opacity-75"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200/80 pb-1 text-xs font-bold overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === "overview" ? "bg-[#0B392B] text-white" : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          Overview & Wallets
        </button>
        <button
          onClick={() => setActiveTab("rules")}
          className={`px-4 py-2 rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === "rules" ? "bg-[#0B392B] text-white" : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          Tier Rules {rules.length > 0 ? `(${rules.length})` : ""}
        </button>
        <button
          onClick={() => setActiveTab("grant")}
          className={`px-4 py-2 rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === "grant" ? "bg-[#0B392B] text-white" : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          Manual Coin Grant
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={`px-4 py-2 rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === "config" ? "bg-[#0B392B] text-white" : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          Global Config
        </button>
      </div>

      {/* TAB 1: OVERVIEW & WALLETS */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-[#E8E1D3] shadow-xs">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                Total Wallets
              </span>
              <span className="text-xl font-extrabold text-[#0B251C] mt-1 block">
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-[#0B392B]" /> : (analytics?.walletCount ?? 0)}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E8E1D3] shadow-xs">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                Active Balance Holders
              </span>
              <span className="text-xl font-extrabold text-emerald-700 mt-1 block">
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-emerald-700" /> : `${analytics?.activeWalletCount ?? 0} Users`}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E8E1D3] shadow-xs">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                Order Rewards Issued
              </span>
              <span className="text-xl font-extrabold text-amber-600 mt-1 block">
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-amber-600" /> : `${analytics?.orderRewardsTotal ?? 0} Coins`}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E8E1D3] shadow-xs">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                Expired Coins
              </span>
              <span className="text-xl font-extrabold text-red-600 mt-1 block">
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-red-600" /> : `${analytics?.expiredTotal ?? 0} Coins`}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8E1D3] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 font-extrabold text-sm text-[#0B251C] flex items-center justify-between">
              <span>User Wallets Directory</span>
              {loading && <Loader2 className="w-4 h-4 animate-spin text-[#0B392B]" />}
            </div>
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#0B392B]" />
                <span className="text-xs font-bold text-gray-500">Loading user wallets...</span>
              </div>
            ) : wallets.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 font-medium">
                No user wallets found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF6ED] border-b border-[#E8E1D3] text-gray-500 font-extrabold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">User Name & Contact</th>
                      <th className="p-3">Current Balance</th>
                      <th className="p-3">Lifetime Earned</th>
                      <th className="p-3">Lifetime Expired</th>
                      <th className="p-3">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {wallets.map((w) => (
                      <tr key={w._id} className="hover:bg-gray-50/50">
                        <td className="p-3">
                          <span className="font-bold text-[#0B251C] block">
                            {(w.user as any)?.name || "Customer"}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400 block">
                            {(w.user as any)?.phone || "-"}
                          </span>
                        </td>
                        <td className="p-3 font-extrabold text-amber-700">
                          {w.balance} Coins
                        </td>
                        <td className="p-3 font-bold text-emerald-700">
                          +{w.lifetimeEarned}
                        </td>
                        <td className="p-3 text-red-600">
                          -{w.lifetimeExpired}
                        </td>
                        <td className="p-3 text-gray-400 text-[11px]">
                          {w.lastCreditedAt ? formatUTCToIST(w.lastCreditedAt) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RULES (EARNING TIERS & DEDUCTION RULES) */}
      {activeTab === "rules" && (
        <div className="flex flex-col gap-6">
          {/* SECTION 1: EARNING TIER RULES */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8E1D3] shadow-xs flex flex-col gap-3.5">
            {/* Organized Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                    🎁
                  </div>
                  <h2 className="text-sm sm:text-base font-extrabold text-[#0B251C]">
                    Order Earning Tiers
                  </h2>
                  <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-extrabold px-2 py-0.5 rounded-full ml-auto">
                    {loading ? "..." : `${rules.length} Active Tiers`}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 font-medium mt-1">
                  Fixed reward coins granted upon customer&apos;s first completed order by order amount.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingRule(null);
                  setRuleLabel("");
                  setRuleMinAmount(49);
                  setRuleFixedCoins(50);
                  setShowRuleModal(true);
                }}
                className="flex items-center justify-center gap-1.5 bg-[#0B392B] hover:bg-[#07281E] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add Tier
              </button>
            </div>

            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#0B392B]" />
                <span className="text-xs font-bold text-gray-500">Loading earning tiers...</span>
              </div>
            ) : rules.length === 0 ? (
              <div className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-500">
                No earning tier rules configured yet. Click &quot;Add Tier&quot; to set up reward coins for first-time orders.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {rules.map((r) => (
                  <div
                    key={r._id}
                    className={`bg-gray-50/70 p-3 rounded-xl border shadow-2xs flex flex-col justify-between gap-2.5 transition-all ${
                      r.isActive ? "border-gray-200 hover:border-[#0B392B]/40" : "border-gray-200 opacity-60"
                    }`}
                  >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-extrabold text-xs sm:text-sm text-[#0B251C] truncate block mb-1">
                        {r.label}
                      </span>
                      <span className="text-[11px] font-bold text-[#0B392B] block">
                        Min Order: ₹{r.minOrderAmount}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md shrink-0 ${
                        r.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {r.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="bg-[#FAF6ED] px-2.5 py-1.5 rounded-lg border border-[#E8E1D3] text-[11px] font-bold text-[#0B251C] flex items-center justify-between">
                    <span className="text-gray-600">Fixed Reward:</span>
                    <span className="text-amber-700 font-extrabold">{r.fixedCoins} Coins</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                    <button
                      onClick={() => handleToggleRule(r._id)}
                      className="text-xs font-bold flex items-center gap-1 text-gray-500 hover:text-[#0B392B] cursor-pointer"
                      title="Toggle Active"
                    >
                      {r.isActive ? (
                        <ToggleRight className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-[10px]">{r.isActive ? "Enabled" : "Disabled"}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingRule(r);
                          setRuleLabel(r.label);
                          setRuleMinAmount(r.minOrderAmount);
                          setRuleFixedCoins(r.fixedCoins);
                          setShowRuleModal(true);
                        }}
                        className="p-1 text-gray-500 hover:text-blue-600 rounded-md cursor-pointer"
                        title="Edit Rule"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(r._id)}
                        className="p-1 text-gray-500 hover:text-red-600 rounded-md cursor-pointer"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>

          {/* SECTION 2: REDEMPTION / DEDUCTION RULES */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8E1D3] shadow-xs flex flex-col gap-3.5">
            {/* Organized Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#0B392B] flex items-center justify-center font-bold text-xs">
                    🪙
                  </div>
                  <h2 className="text-sm sm:text-base font-extrabold text-[#0B251C]">
                    Coin Deduction Rules
                  </h2>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold px-2 py-0.5 rounded-full ml-auto">
                    {loading ? "..." : `${redemptionRules.length} Rules`}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 font-medium mt-1">
                  Configure maximum deductible coins based on customer cart order amounts.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingRedemptionRule(null);
                  setRedemptionLabel("");
                  setRedemptionMinAmount(100);
                  setRedemptionMaxCoins(20);
                  setShowRedemptionModal(true);
                }}
                className="flex items-center justify-center gap-1.5 bg-[#0B392B] hover:bg-[#07281E] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add Deduction Rule
              </button>
            </div>

            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#0B392B]" />
                <span className="text-xs font-bold text-gray-500">Loading deduction rules...</span>
              </div>
            ) : redemptionRules.length === 0 ? (
              <div className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-500">
                No deduction rules configured yet. Click &quot;Add Deduction Rule&quot; to set up deduction limits per order amount.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {redemptionRules.map((r) => (
                  <div
                    key={r._id}
                    className={`bg-gray-50/70 p-3 rounded-xl border shadow-2xs flex flex-col justify-between gap-2.5 transition-all ${
                      r.isActive ? "border-gray-200 hover:border-[#0B392B]/40" : "border-gray-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-extrabold text-xs sm:text-sm text-[#0B251C] truncate block">
                          {r.label || `Orders ₹${r.minOrderAmount}+`}
                        </span>
                        <span className="text-[11px] font-bold text-[#0B392B] block">
                          Min Cart Amount: ₹{r.minOrderAmount}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md shrink-0 ${
                          r.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {r.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 text-[11px] font-bold text-[#0B251C] flex items-center justify-between">
                      <span className="text-gray-600">Max Deductible:</span>
                      <span className="text-emerald-700 font-extrabold">
                        {r.maxCoinsDeductible} Coins (₹{r.maxCoinsDeductible})
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-gray-200/80">
                      <button
                        onClick={() => handleToggleRedemptionRule(r._id)}
                        className="text-xs font-bold flex items-center gap-1 text-gray-500 hover:text-[#0B392B] cursor-pointer"
                        title="Toggle Active"
                      >
                        {r.isActive ? (
                          <ToggleRight className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-[10px]">{r.isActive ? "Enabled" : "Disabled"}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingRedemptionRule(r);
                            setRedemptionLabel(r.label || `Orders ₹${r.minOrderAmount}+`);
                            setRedemptionMinAmount(r.minOrderAmount);
                            setRedemptionMaxCoins(r.maxCoinsDeductible);
                            setShowRedemptionModal(true);
                          }}
                          className="p-1 text-gray-500 hover:text-blue-600 rounded-md cursor-pointer"
                          title="Edit Rule"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRedemptionRule(r._id)}
                          className="p-1 text-gray-500 hover:text-red-600 rounded-md cursor-pointer"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MANUAL GRANT */}
      {activeTab === "grant" && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E1D3] shadow-xs max-w-xl mx-auto w-full flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Gift className="w-5 h-5 text-[#0B392B]" />
            <h2 className="text-base font-extrabold text-[#0B251C]">Manual Coin Grant</h2>
          </div>

          <form onSubmit={handleGrantSubmit} className="flex flex-col gap-4 text-xs">
            {/* Search User by Phone */}
            <div className="relative flex flex-col gap-2">
              <label className="font-extrabold text-gray-700 block">
                Search User by Phone Number
              </label>

              {/* Selected Users Chips List */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  {selectedUsers.map((su) => (
                    <div
                      key={su.id}
                      className="inline-flex items-center gap-1.5 bg-white border border-emerald-300 text-[#0B251C] px-2.5 py-1 rounded-lg text-xs font-bold shadow-xs"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-[#0B392B]" />
                      <span>{su.name}</span>
                      <span className="text-[10px] font-mono text-gray-500">({su.phone})</span>
                      <button
                        type="button"
                        onClick={() => setSelectedUsers((prev) => prev.filter((u) => u.id !== su.id))}
                        className="text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100 p-0.5 transition cursor-pointer ml-1"
                        title="Remove user"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Search Box - Always Visible */}
              <div className="relative">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={phoneSearchQuery}
                    onChange={(e) => setPhoneSearchQuery(e.target.value)}
                    placeholder="Enter user phone number to search & add..."
                    className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-[#0B392B] font-mono text-xs"
                  />
                  {isSearchingPhone && (
                    <Loader2 className="w-3.5 h-3.5 text-[#0B392B] animate-spin absolute right-3" />
                  )}
                </div>

                {/* Dropdown Results List */}
                {phoneSearchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-gray-100">
                    {phoneSearchResults.map((u) => {
                      const uid = u.id || u._id || "";
                      const isAlreadySelected = selectedUsers.some((su) => su.id === uid);
                      return (
                        <div
                          key={uid || u.phone}
                          onClick={() => {
                            if (!isAlreadySelected && uid) {
                              setSelectedUsers((prev) => [...prev, { id: uid, name: u.name, phone: u.phone }]);
                            }
                            setPhoneSearchQuery("");
                            setPhoneSearchResults([]);
                          }}
                          className={`p-2.5 hover:bg-emerald-50/70 transition cursor-pointer flex items-center justify-between ${
                            isAlreadySelected ? "opacity-50 cursor-not-allowed bg-gray-50" : ""
                          }`}
                        >
                          <div>
                            <span className="font-extrabold text-[#0B251C] block text-xs">{u.name}</span>
                            <span className="text-[10px] font-mono text-gray-500 block">{u.phone}</span>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              isAlreadySelected
                                ? "bg-gray-200 text-gray-600"
                                : "bg-emerald-100 text-[#0B392B]"
                            }`}
                          >
                            {isAlreadySelected ? "Added" : "+ Add User"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {phoneSearchQuery.trim() && !isSearchingPhone && phoneSearchResults.length === 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl p-3 shadow-lg z-50 text-center text-xs text-gray-400 font-medium">
                    No registered user found with phone "{phoneSearchQuery}"
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="font-extrabold text-gray-700 block mb-1">Coin Amount to Grant</label>
              <input
                type="number"
                value={grantAmount}
                onChange={(e) => setGrantAmount(Number(e.target.value))}
                min={1}
                required
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-[#0B392B] font-bold"
              />
            </div>

            <div>
              <label className="font-extrabold text-gray-700 block mb-1">
                Reason for Grant <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                placeholder="Festive Bonus / Festival Campaign"
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-[#0B392B]"
              />
            </div>

            {grantMessage && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-bold">
                {grantMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={grantSubmitting}
              className="w-full bg-[#0B392B] hover:bg-[#07281E] text-white font-extrabold py-3 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              {grantSubmitting ? "Granting Coins..." : "Grant Coins to Users"}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: GLOBAL CONFIG */}
      {activeTab === "config" && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E1D3] shadow-xs max-w-xl mx-auto w-full flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Sliders className="w-5 h-5 text-[#0B392B]" />
            <h2 className="text-base font-extrabold text-[#0B251C]">Global Coin Settings</h2>
          </div>

          {loading || !configData ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#0B392B]" />
              <span className="text-xs font-bold text-gray-500">Loading coin configuration...</span>
            </div>
          ) : (
            <form onSubmit={handleUpdateConfig} className="flex flex-col gap-4 text-xs font-bold">
              <div>
                <label className="text-gray-700 block mb-1">Welcome Bonus Coins (Registration)</label>
              <input
                type="number"
                value={configData.welcomeBonusCoins}
                onChange={(e) => setConfigData({ ...configData, welcomeBonusCoins: Number(e.target.value) })}
                className="w-full p-3 border rounded-xl bg-gray-50"
              />
            </div>

            <div>
              <label className="text-gray-700 block mb-1">Inactivity Expiry Window (Days)</label>
              <input
                type="number"
                value={configData.expiryInactivityDays}
                onChange={(e) => setConfigData({ ...configData, expiryInactivityDays: Number(e.target.value) })}
                className="w-full p-3 border rounded-xl bg-gray-50"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#0B392B] hover:bg-[#07281E] text-white py-3 rounded-xl transition cursor-pointer"
            >
              Save Settings
            </button>
          </form>
          )}
        </div>
      )}

      {/* RULE MODAL */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 text-xs">
            <h3 className="text-base font-extrabold text-[#0B251C]">
              {editingRule ? "Edit Tier Rule" : "Create Tier Rule"}
            </h3>

            <form onSubmit={handleSaveRule} className="flex flex-col gap-3">
              <div>
                <label className="font-extrabold block mb-1">Tier Label</label>
                <input
                  type="text"
                  value={ruleLabel}
                  onChange={(e) => setRuleLabel(e.target.value)}
                  placeholder="Tier 1 (₹49+)"
                  required
                  className="w-full p-2.5 border rounded-xl bg-gray-50"
                />
              </div>

              <div>
                <label className="font-extrabold block mb-1">Min Order Amount (₹)</label>
                <input
                  type="number"
                  value={ruleMinAmount}
                  onChange={(e) => setRuleMinAmount(Number(e.target.value))}
                  required
                  className="w-full p-2.5 border rounded-xl bg-gray-50 font-bold"
                />
              </div>

              <div>
                <label className="font-extrabold block mb-1">First-Time Fixed Coins</label>
                <input
                  type="number"
                  value={ruleFixedCoins}
                  onChange={(e) => setRuleFixedCoins(Number(e.target.value))}
                  required
                  className="w-full p-2.5 border rounded-xl bg-gray-50 font-bold text-amber-700"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="w-full py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0B392B] text-white font-bold rounded-xl cursor-pointer"
                >
                  Save Tier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REDEMPTION RULE MODAL */}
      {showRedemptionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 text-xs">
            <h3 className="text-base font-extrabold text-[#0B251C]">
              {editingRedemptionRule ? "Edit Redemption Rule" : "Create Redemption Rule"}
            </h3>

            <form onSubmit={handleSaveRedemptionRule} className="flex flex-col gap-3">
              <div>
                <label className="font-extrabold block mb-1">Rule Label (Optional)</label>
                <input
                  type="text"
                  value={redemptionLabel}
                  onChange={(e) => setRedemptionLabel(e.target.value)}
                  placeholder="e.g. Orders ₹100+"
                  className="w-full p-2.5 border rounded-xl bg-gray-50"
                />
              </div>

              <div>
                <label className="font-extrabold block mb-1">Min Order Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={redemptionMinAmount}
                  onChange={(e) => setRedemptionMinAmount(Number(e.target.value))}
                  required
                  placeholder="100"
                  className="w-full p-2.5 border rounded-xl bg-gray-50 font-bold"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  Customer cart must reach this subtotal to unlock this tier.
                </span>
              </div>

              <div>
                <label className="font-extrabold block mb-1">Max Coins Deductible (Coins / ₹)</label>
                <input
                  type="number"
                  min="1"
                  value={redemptionMaxCoins}
                  onChange={(e) => setRedemptionMaxCoins(Number(e.target.value))}
                  required
                  placeholder="20"
                  className="w-full p-2.5 border rounded-xl bg-gray-50 font-bold text-emerald-700"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  Maximum coins (₹ discount) customer can redeem at this tier.
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRedemptionModal(false)}
                  className="w-full py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0B392B] text-white font-bold rounded-xl cursor-pointer"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminBottomNav />
    </div>
  );
}

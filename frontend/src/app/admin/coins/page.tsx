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
} from "lucide-react";
import AdminBottomNav from "@/components/AdminBottomNav";
import {
  getAdminCoinAnalytics,
  getAdminCoinConfig,
  getAdminCoinRules,
  getAdminWallets,
  adminGrantCoins,
  createCoinRule,
  updateCoinRule,
  toggleCoinRuleStatus,
  deleteCoinRule,
  updateAdminCoinConfig,
  CoinRuleRecord,
  CoinWalletRecord,
  CoinConfigRecord,
} from "@/services/coinService";
import { formatUTCToIST } from "@/utils/datetime";

export default function AdminCoinsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "rules" | "grant" | "config">("overview");
  const [analytics, setAnalytics] = useState<any>(null);
  const [rules, setRules] = useState<CoinRuleRecord[]>([]);
  const [wallets, setWallets] = useState<CoinWalletRecord[]>([]);
  const [configData, setConfigData] = useState<CoinConfigRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Grant Modal state
  const [grantUserIds, setGrantUserIds] = useState<string>("");
  const [grantAmount, setGrantAmount] = useState<number>(10);
  const [grantReason, setGrantReason] = useState<string>("");
  const [grantSubmitting, setGrantSubmitting] = useState<boolean>(false);
  const [grantMessage, setGrantMessage] = useState<string>("");

  // Rule Form state
  const [showRuleModal, setShowRuleModal] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<CoinRuleRecord | null>(null);
  const [ruleLabel, setRuleLabel] = useState<string>("");
  const [ruleMinAmount, setRuleMinAmount] = useState<number>(49);
  const [ruleFixedCoins, setRuleFixedCoins] = useState<number>(5);

  const fetchAllAdminData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, rulesRes, walletsRes, configRes] = await Promise.all([
        getAdminCoinAnalytics(),
        getAdminCoinRules(),
        getAdminWallets(1, 20),
        getAdminCoinConfig(),
      ]);
      setAnalytics(analyticsRes);
      setRules(rulesRes);
      setWallets(walletsRes.wallets || []);
      setConfigData(configRes);
    } catch (err) {
      console.error("Failed to fetch admin coin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  const handleGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantUserIds.trim() || !grantReason.trim() || grantAmount <= 0) return;

    setGrantSubmitting(true);
    setGrantMessage("");
    try {
      const uids = grantUserIds.split(",").map((id) => id.trim()).filter(Boolean);
      const res = await adminGrantCoins(uids, grantAmount, grantReason);
      setGrantMessage(`Successfully granted ${grantAmount} coins to ${res.succeeded?.length || 0} user(s).`);
      setGrantUserIds("");
      setGrantReason("");
      fetchAllAdminData();
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
      fetchAllAdminData();
    } catch (err: any) {
      alert(err?.message || "Failed to save tier rule");
    }
  };

  const handleToggleRule = async (id: string) => {
    try {
      await toggleCoinRuleStatus(id);
      fetchAllAdminData();
    } catch (err) {
      console.error("Failed to toggle rule:", err);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tier rule?")) return;
    try {
      await deleteCoinRule(id);
      fetchAllAdminData();
    } catch (err) {
      console.error("Failed to delete rule:", err);
    }
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configData) return;
    try {
      await updateAdminCoinConfig(configData);
      alert("Global coin settings updated successfully!");
      fetchAllAdminData();
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
          onClick={fetchAllAdminData}
          className="flex items-center justify-center gap-1.5 bg-[#0B392B] hover:bg-[#07281E] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
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
          Tier Rules ({rules.length})
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
                {analytics?.walletCount ?? 0}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E8E1D3] shadow-xs">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                Active Balance Holders
              </span>
              <span className="text-xl font-extrabold text-emerald-700 mt-1 block">
                {analytics?.activeWalletCount ?? 0} Users
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E8E1D3] shadow-xs">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                Order Rewards Issued
              </span>
              <span className="text-xl font-extrabold text-amber-600 mt-1 block">
                {analytics?.orderRewardsTotal ?? 0} Coins
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E8E1D3] shadow-xs">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                Expired Coins
              </span>
              <span className="text-xl font-extrabold text-red-600 mt-1 block">
                {analytics?.expiredTotal ?? 0} Coins
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8E1D3] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 font-extrabold text-sm text-[#0B251C]">
              User Wallets Directory
            </div>
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
          </div>
        </div>
      )}

      {/* TAB 2: TIER RULES */}
      {activeTab === "rules" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#0B251C]">Earning Tier Rules</h2>
            <button
              onClick={() => {
                setEditingRule(null);
                setRuleLabel("");
                setRuleMinAmount(49);
                setRuleFixedCoins(5);
                setShowRuleModal(true);
              }}
              className="flex items-center gap-1.5 bg-[#0B392B] hover:bg-[#07281E] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Tier Rule
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rules.map((r) => (
              <div
                key={r._id}
                className={`bg-white p-4 rounded-2xl border shadow-xs flex flex-col justify-between gap-3 ${
                  r.isActive ? "border-[#E8E1D3]" : "border-gray-200 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-extrabold text-sm text-[#0B251C] block">{r.label}</span>
                    <span className="text-xs font-bold text-[#0B392B] mt-0.5 block">
                      Min Order Total: ₹{r.minOrderAmount}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      r.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {r.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="bg-[#FAF6ED] p-2.5 rounded-xl border border-[#E8E1D3] text-xs font-bold text-[#0B251C] flex items-center justify-between">
                  <span>First-Time Fixed Reward</span>
                  <span className="text-amber-600 font-extrabold">{r.fixedCoins} Coins</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
                  <button
                    onClick={() => handleToggleRule(r._id)}
                    className="p-1.5 text-gray-500 hover:text-[#0B392B] cursor-pointer"
                    title="Toggle Active"
                  >
                    {r.isActive ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                  </button>
                  <button
                    onClick={() => {
                      setEditingRule(r);
                      setRuleLabel(r.label);
                      setRuleMinAmount(r.minOrderAmount);
                      setRuleFixedCoins(r.fixedCoins);
                      setShowRuleModal(true);
                    }}
                    className="p-1.5 text-gray-500 hover:text-blue-600 cursor-pointer"
                    title="Edit Rule"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRule(r._id)}
                    className="p-1.5 text-gray-500 hover:text-red-600 cursor-pointer"
                    title="Delete Rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
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
            <div>
              <label className="font-extrabold text-gray-700 block mb-1">
                User IDs (Comma separated for bulk grant)
              </label>
              <textarea
                value={grantUserIds}
                onChange={(e) => setGrantUserIds(e.target.value)}
                placeholder="6a7790e6611d881a4628754c, 6a840a1d731a430ac8977312"
                rows={3}
                required
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-[#0B392B] font-mono"
              />
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
              <label className="font-extrabold text-gray-700 block mb-1">Reason for Grant</label>
              <input
                type="text"
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                placeholder="Festive Bonus / Festival Campaign"
                required
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
      {activeTab === "config" && configData && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E1D3] shadow-xs max-w-xl mx-auto w-full flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Sliders className="w-5 h-5 text-[#0B392B]" />
            <h2 className="text-base font-extrabold text-[#0B251C]">Global Coin Settings</h2>
          </div>

          <form onSubmit={handleUpdateConfig} className="flex flex-col gap-4 text-xs font-bold">
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
              <span>Enable Homely Coins Engine</span>
              <input
                type="checkbox"
                checked={configData.isCoinSystemEnabled}
                onChange={(e) => setConfigData({ ...configData, isCoinSystemEnabled: e.target.checked })}
                className="w-5 h-5 accent-[#0B392B]"
              />
            </div>

            <div>
              <label className="text-gray-700 block mb-1">Welcome Bonus Coins (Registration)</label>
              <input
                type="number"
                value={configData.welcomeBonusCoins}
                onChange={(e) => setConfigData({ ...configData, welcomeBonusCoins: Number(e.target.value) })}
                className="w-full p-3 border rounded-xl bg-gray-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-700 block mb-1">Repeat Reward Min %</label>
                <input
                  type="number"
                  value={configData.repeatRewardPercentMin}
                  onChange={(e) => setConfigData({ ...configData, repeatRewardPercentMin: Number(e.target.value) })}
                  className="w-full p-3 border rounded-xl bg-gray-50"
                />
              </div>
              <div>
                <label className="text-gray-700 block mb-1">Repeat Reward Max %</label>
                <input
                  type="number"
                  value={configData.repeatRewardPercentMax}
                  onChange={(e) => setConfigData({ ...configData, repeatRewardPercentMax: Number(e.target.value) })}
                  className="w-full p-3 border rounded-xl bg-gray-50"
                />
              </div>
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
                  className="w-full py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0B392B] text-white font-bold rounded-xl"
                >
                  Save Tier
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

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Header from "@/components/Header";
import AdminBottomNav from "@/components/AdminBottomNav";
import {
  Trophy,
  Crown,
  Medal,
  Flame,
  Search,
  Filter,
  Sliders,
  Gift,
  CheckCircle,
  AlertCircle,
  Clock,
  Coins,
  RefreshCw,
  X,
  Plus,
  Trash2,
  Shield,
  Check,
  Target,
  Settings2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getAdminLeaderboard,
  getLeaderboardConfig,
  updateLeaderboardConfig,
  resolveLeaderboardTie,
  getLeaderboardRewardLogs,
  AdminLeaderboardResponse,
  LeaderboardConfigData,
  LeaderboardUserItem,
  LeaderboardRewardLogItem,
} from "@/services/leaderboardService";

export default function AdminLeaderboardPage() {
  const [activeTab, setActiveTab] = useState<"table" | "config" | "rewards">("table");
  const [period, setPeriod] = useState<"weekly" | "monthly" | "all_time">("monthly");
  const [leaderboardData, setLeaderboardData] = useState<AdminLeaderboardResponse | null>(null);
  const [configData, setConfigData] = useState<LeaderboardConfigData | null>(null);
  const [rewardLogs, setRewardLogs] = useState<LeaderboardRewardLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Tie-breaker decision modal
  const [tieModalItem, setTieModalItem] = useState<LeaderboardUserItem | null>(null);
  const [tieRewardType, setTieRewardType] = useState<"DISCOUNT_VOUCHER" | "COINS" | "FREE_ITEM">("DISCOUNT_VOUCHER");
  const [tieDiscountAmount, setTieDiscountAmount] = useState<number>(100);
  const [tieMinOrderAmount, setTieMinOrderAmount] = useState<number>(300);
  const [tieCoinsAmount, setTieCoinsAmount] = useState<number>(75);
  const [tieFreeItemName, setTieFreeItemName] = useState<string>("Free Homely Foods Combo Meal");
  const [tieDecisionNote, setTieDecisionNote] = useState<string>("");
  const [tieSubmitting, setTieSubmitting] = useState<boolean>(false);

  // Config form editing state
  const [configForm, setConfigForm] = useState<LeaderboardConfigData | null>(null);
  const [configSaving, setConfigSaving] = useState<boolean>(false);
  const [configSuccessMsg, setConfigSuccessMsg] = useState<string>("");

  // Horizontal tabs scroll state
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false);

  const checkTabsScroll = useCallback(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    // canScrollLeft if we have scrolled more than 2px
    setCanScrollLeft(scrollLeft > 2);
    // canScrollRight if remaining scrollable distance is more than 2px
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  const handleTabsScrollBy = (direction: "left" | "right") => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const scrollAmount = 200;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    checkTabsScroll();
    el.addEventListener("scroll", checkTabsScroll, { passive: true });
    window.addEventListener("resize", checkTabsScroll);
    return () => {
      el.removeEventListener("scroll", checkTabsScroll);
      window.removeEventListener("resize", checkTabsScroll);
    };
  }, [checkTabsScroll]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      if (activeTab === "table") {
        const res = await getAdminLeaderboard(period);
        setLeaderboardData(res);
      } else if (activeTab === "config") {
        const res = await getLeaderboardConfig();
        setConfigData(res);
        setConfigForm(JSON.parse(JSON.stringify(res)));
      } else if (activeTab === "rewards") {
        const res = await getLeaderboardRewardLogs();
        setRewardLogs(res);
      }
    } catch (err) {
      console.error("Failed to load admin leaderboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen to header reload/refresh button
  useEffect(() => {
    const onAdminRefresh = () => {
      loadData();
    };
    window.addEventListener("admin:refresh-data", onAdminRefresh);
    return () => window.removeEventListener("admin:refresh-data", onAdminRefresh);
  }, [loadData]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configForm) return;
    try {
      setConfigSaving(true);
      const updated = await updateLeaderboardConfig(configForm);
      setConfigData(updated);
      setConfigForm(JSON.parse(JSON.stringify(updated)));
      setConfigSuccessMsg("Leaderboard settings saved successfully!");
      setTimeout(() => setConfigSuccessMsg(""), 3500);
    } catch (err: any) {
      alert(err.message || "Failed to update leaderboard config");
    } finally {
      setConfigSaving(false);
    }
  };

  const handleResolveTie = async () => {
    if (!tieModalItem || !leaderboardData) return;
    try {
      setTieSubmitting(true);
      await resolveLeaderboardTie({
        customerId: tieModalItem.customerId,
        rankPosition: tieModalItem.rank,
        period: leaderboardData.period,
        periodKey: leaderboardData.periodKey,
        rewardType: tieRewardType,
        rewardDetails:
          tieRewardType === "FREE_ITEM"
            ? { freeItemName: tieFreeItemName, validityDays: 30 }
            : tieRewardType === "DISCOUNT_VOUCHER"
            ? { discountAmount: tieDiscountAmount, minOrderAmount: tieMinOrderAmount, validityDays: 30 }
            : { coinsAmount: tieCoinsAmount },
        note: tieDecisionNote || `Admin approved reward for tied Rank #${tieModalItem.rank}`,
      });

      alert(`Reward successfully dispatched to ${tieModalItem.customerName}!`);
      setTieModalItem(null);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to resolve tie");
    } finally {
      setTieSubmitting(false);
    }
  };

  // Filter table by customer search
  const filteredCustomers = (leaderboardData?.customers || []).filter((c) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.customerName?.toLowerCase().includes(query) ||
      c.customerPhone?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-[#F4F9FA] flex flex-col justify-between pb-24">
      <div>
        <Header />

        {/* Page Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-[#0B392B]">
                <Trophy className="w-5 h-5 text-amber-500" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Leaderboard Management
              </h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Manage leaderboard rules, review customer rankings, and resolve tied rewards.
            </p>
          </div>

          {/* Navigation Tabs - Horizontal Scrollable with Left & Right Arrows */}
          <div className="max-w-7xl mx-auto px-2 sm:px-6 border-t border-gray-100 relative flex items-center">
            {/* Left Scroll Arrow */}
            <button
              type="button"
              onClick={() => handleTabsScrollBy("left")}
              disabled={!canScrollLeft}
              aria-label="Scroll tabs left"
              className={`p-1.5 rounded-full transition-all shrink-0 cursor-pointer ${
                canScrollLeft
                  ? "text-gray-700 hover:text-black hover:bg-gray-100"
                  : "text-gray-400 opacity-40 cursor-not-allowed pointer-events-none"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Scrollable Tabs Container */}
            <div
              ref={tabsContainerRef}
              className="flex-1 flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth px-1"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <button
                onClick={() => setActiveTab("table")}
                className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  activeTab === "table"
                    ? "border-[#0B392B] text-[#0B392B]"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Customer Rankings</span>
              </button>
              <button
                onClick={() => setActiveTab("config")}
                className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  activeTab === "config"
                    ? "border-[#0B392B] text-[#0B392B]"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                <Settings2 className="w-4 h-4 shrink-0" />
                <span>Leaderboard Settings</span>
              </button>
              <button
                onClick={() => setActiveTab("rewards")}
                className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  activeTab === "rewards"
                    ? "border-[#0B392B] text-[#0B392B]"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                <Gift className="w-4 h-4 shrink-0" />
                <span>Reward Audit Logs</span>
              </button>
            </div>

            {/* Right Scroll Arrow */}
            <button
              type="button"
              onClick={() => handleTabsScrollBy("right")}
              disabled={!canScrollRight}
              aria-label="Scroll tabs right"
              className={`p-1.5 rounded-full transition-all shrink-0 cursor-pointer ${
                canScrollRight
                  ? "text-gray-700 hover:text-black hover:bg-gray-100"
                  : "text-gray-400 opacity-40 cursor-not-allowed pointer-events-none"
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Customer Rankings Table */}
        {activeTab === "table" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200/80">
              {/* Filter Controls: Period & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                  {(
                    [
                      { id: "monthly", label: "Monthly" },
                      { id: "weekly", label: "Weekly" },
                      { id: "all_time", label: "All Time" },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPeriod(p.id)}
                      className={`flex-1 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        period === p.id
                          ? "bg-[#0B392B] text-white shadow-xs"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="relative max-w-xs w-full">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#0B392B]"
                  />
                </div>
              </div>

              {/* Data Table with Content-Driven Column Widths */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-600 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3 font-bold whitespace-nowrap">Rank</th>
                      <th className="py-3 px-3 font-bold whitespace-nowrap">Customer Name</th>
                      <th className="py-3 px-3 font-bold whitespace-nowrap">Phone Number</th>
                      <th className="py-3 px-3 font-bold text-center whitespace-nowrap">Completed Orders</th>
                      <th className="py-3 px-3 font-bold text-right whitespace-nowrap">Eligible Spent</th>
                      <th className="py-3 px-3 font-bold text-center whitespace-nowrap">Gap to 1st</th>
                      <th className="py-3 px-3 font-bold text-center whitespace-nowrap">Coins Earned</th>
                      <th className="py-3 px-3 font-bold text-center whitespace-nowrap">Rank Maintain</th>
                      <th className="py-3 px-3 font-bold text-center whitespace-nowrap">Daily Streak</th>
                      <th className="py-3 px-3 font-bold text-center whitespace-nowrap">Status / Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-gray-400 font-medium">
                          Loading rankings...
                        </td>
                      </tr>
                    ) : filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-gray-400 font-medium">
                          No qualifying customer rankings found for this period.
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((cust) => (
                        <tr
                          key={cust.customerId}
                          className={`hover:bg-gray-50/80 transition-colors ${
                            cust.isTied ? "bg-amber-50/40" : ""
                          }`}
                        >
                          <td className="py-3 px-3 font-extrabold text-sm">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                                  cust.rank === 1
                                    ? "bg-amber-100 text-amber-800 font-black border border-amber-300"
                                    : cust.rank === 2
                                    ? "bg-slate-100 text-slate-700 font-bold border border-slate-300"
                                    : cust.rank === 3
                                    ? "bg-amber-50 text-amber-900 font-bold border border-amber-600"
                                    : "text-gray-600"
                                }`}
                              >
                                #{cust.rank}
                              </span>
                              {cust.isTied && (
                                <span className="px-1.5 py-0.5 rounded-sm bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider">
                                  Tied
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-bold text-gray-900">
                            {cust.customerName}
                          </td>
                          <td className="py-3 px-3 font-medium text-gray-600">
                            {cust.customerPhone}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-gray-800">
                            {cust.completedOrdersCount}
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-[#0B392B]">
                            ₹{cust.totalSpending.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {cust.rank === 1 ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                                Leader
                              </span>
                            ) : (
                              <span className="text-amber-700 font-semibold text-[11px]">
                                ₹{cust.gapToFirst.toLocaleString("en-IN")}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-amber-700">
                            {cust.totalCoinsEarned}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold text-[11px]">
                              {cust.consecutiveDaysAtCurrentRank} days
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 font-semibold text-[11px] inline-flex items-center gap-1">
                              <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                              {cust.consecutiveOrderDays} days
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {cust.isTied ? (
                              <button
                                onClick={() => setTieModalItem(cust)}
                                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] shadow-xs cursor-pointer"
                              >
                                Decide Award
                              </button>
                            ) : cust.rewardStatus === "CLAIMED" ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Rewarded
                              </span>
                            ) : (
                              <span className="text-gray-400 font-medium text-[11px]">
                                Active
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Admin Panel Settings (Section 7 from infographic) */}
        {activeTab === "config" && configForm && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
            <form onSubmit={handleSaveConfig} className="space-y-6">
              {configSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{configSuccessMsg}</span>
                </div>
              )}

              {/* Section 7 - Leaderboard Configuration */}
              <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200">
                <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-[#0B392B]" />
                  <span>Leaderboard Configuration</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Leaderboard Period
                    </label>
                    <select
                      value={configForm.periodMode}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          periodMode: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden focus:border-[#0B392B]"
                    >
                      <option value="MONTHLY_ONLY">Monthly only (Recommended)</option>
                      <option value="MULTI_PERIOD">Multi-period (Weekly, Monthly, All Time)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Min. Eligible Order Amount (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={configForm.minEligibleOrderAmount}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          minEligibleOrderAmount: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden focus:border-[#0B392B]"
                      required
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Orders below this threshold will be excluded from eligible spending and count.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Number of Top Customers in Public Ranking
                    </label>
                    <select
                      value={configForm.publicTopCount}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          publicTopCount: parseInt(e.target.value, 10) || 5,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden focus:border-[#0B392B]"
                    >
                      <option value={3}>Top 3</option>
                      <option value={5}>Top 5 (Recommended)</option>
                      <option value={10}>Top 10</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Customer Name Privacy Format
                    </label>
                    <select
                      value={configForm.nameDisplayFormat}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          nameDisplayFormat: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden focus:border-[#0B392B]"
                    >
                      <option value="INITIALS">Short Initials (e.g., R. P., P. S.)</option>
                      <option value="FIRST_NAME_INITIAL">First Name + Last Initial (e.g., Rahul P.)</option>
                    </select>
                  </div>
                </div>

                {/* Section 4 & 7 - Eligible Rules Checkboxes */}
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <span className="block text-xs font-bold text-gray-800 mb-2">
                    Calculation & Exclusion Rules
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-200/80 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={configForm.excludeCoinsUsed}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            excludeCoinsUsed: e.target.checked,
                          })
                        }
                        className="rounded text-[#0B392B] focus:ring-0"
                      />
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">
                          Exclude coins used
                        </span>
                        <span className="text-[10px] text-gray-500">
                          Counts order value before coins deduction.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-200/80 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={configForm.excludeDeliveryCharges}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            excludeDeliveryCharges: e.target.checked,
                          })
                        }
                        className="rounded text-[#0B392B] focus:ring-0"
                      />
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">
                          Exclude delivery charges
                        </span>
                        <span className="text-[10px] text-gray-500">
                          Counts pure food subtotal minus discounts.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Dual Key Requirements (Your Business Rule) */}
              <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200">
                <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>Dual Key Retention Requirements</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Key 1: Position Maintenance (Days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={configForm.positionMaintainDays}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          positionMaintainDays: parseInt(e.target.value, 10) || 1,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden focus:border-[#0B392B]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Key 2: Consecutive Order Streak (Days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={configForm.orderStreakDays}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          orderStreakDays: parseInt(e.target.value, 10) || 1,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden focus:border-[#0B392B]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 5 & 7 Prize Settings */}
              <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-amber-500" />
                    <span>Monthly Prize Settings</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const nextRank = configForm.rewardTiers.length + 1;
                      setConfigForm({
                        ...configForm,
                        rewardTiers: [
                          ...configForm.rewardTiers,
                          {
                            rankPosition: nextRank,
                            title: `Prize for Rank #${nextRank}`,
                            rewardType: "DISCOUNT_VOUCHER",
                            rewardDetails: { discountAmount: 50, minOrderAmount: 200, validityDays: 30 },
                          },
                        ],
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Prize</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {configForm.rewardTiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 relative"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#0B392B] text-amber-300 font-black text-xs">
                          {tier.rankPosition === 1 ? "1st Prize" : tier.rankPosition === 2 ? "2nd Prize" : tier.rankPosition === 3 ? "3rd Prize" : `Rank #${tier.rankPosition} Prize`}
                        </span>
                        {configForm.rewardTiers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newTiers = configForm.rewardTiers.filter(
                                (_, i) => i !== idx
                              );
                              setConfigForm({ ...configForm, rewardTiers: newTiers });
                            }}
                            className="p-1 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">
                            Prize Label / Description
                          </label>
                          <input
                            type="text"
                            value={tier.title}
                            onChange={(e) => {
                              const updatedTiers = [...configForm.rewardTiers];
                              updatedTiers[idx].title = e.target.value;
                              setConfigForm({ ...configForm, rewardTiers: updatedTiers });
                            }}
                            className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">
                            Reward Type
                          </label>
                          <select
                            value={tier.rewardType}
                            onChange={(e) => {
                              const updatedTiers = [...configForm.rewardTiers];
                              updatedTiers[idx].rewardType = e.target.value as any;
                              setConfigForm({ ...configForm, rewardTiers: updatedTiers });
                            }}
                            className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden"
                          >
                            <option value="FREE_ITEM">Free Item / Combo Meal</option>
                            <option value="DISCOUNT_VOUCHER">Discount Voucher</option>
                            <option value="COINS">Homely Coins</option>
                          </select>
                        </div>

                        {tier.rewardType === "FREE_ITEM" ? (
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-1">
                              Free Item Name
                            </label>
                            <input
                              type="text"
                              value={tier.rewardDetails.freeItemName || "Free Homely Foods Combo Meal"}
                              onChange={(e) => {
                                const updatedTiers = [...configForm.rewardTiers];
                                updatedTiers[idx].rewardDetails.freeItemName = e.target.value;
                                setConfigForm({ ...configForm, rewardTiers: updatedTiers });
                              }}
                              className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden"
                            />
                          </div>
                        ) : tier.rewardType === "DISCOUNT_VOUCHER" ? (
                          <div className="flex gap-2">
                            <div className="w-1/2">
                              <label className="block text-[10px] font-bold text-gray-600 mb-1">
                                Discount (₹)
                              </label>
                              <input
                                type="number"
                                min={1}
                                value={tier.rewardDetails.discountAmount || 100}
                                onChange={(e) => {
                                  const updatedTiers = [...configForm.rewardTiers];
                                  updatedTiers[idx].rewardDetails.discountAmount =
                                    parseInt(e.target.value, 10) || 0;
                                  setConfigForm({ ...configForm, rewardTiers: updatedTiers });
                                }}
                                className="w-full px-2 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden"
                              />
                            </div>
                            <div className="w-1/2">
                              <label className="block text-[10px] font-bold text-gray-600 mb-1">
                                Min Cart (₹)
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={tier.rewardDetails.minOrderAmount || 300}
                                onChange={(e) => {
                                  const updatedTiers = [...configForm.rewardTiers];
                                  updatedTiers[idx].rewardDetails.minOrderAmount =
                                    parseInt(e.target.value, 10) || 0;
                                  setConfigForm({ ...configForm, rewardTiers: updatedTiers });
                                }}
                                className="w-full px-2 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden"
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-1">
                              Coins to Credit
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={tier.rewardDetails.coinsAmount || 50}
                              onChange={(e) => {
                                const updatedTiers = [...configForm.rewardTiers];
                                updatedTiers[idx].rewardDetails.coinsAmount =
                                  parseInt(e.target.value, 10) || 0;
                                setConfigForm({ ...configForm, rewardTiers: updatedTiers });
                              }}
                              className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={configSaving}
                  className="px-6 py-2.5 rounded-2xl bg-[#0B392B] hover:bg-[#0E4937] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {configSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Settings</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 3: Reward Audit Logs */}
        {activeTab === "rewards" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200/80">
              <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
                <Gift className="w-4 h-4 text-emerald-600" />
                <span>Dispatched Reward Logs (Audit Trail)</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-600 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3 font-bold">Date</th>
                      <th className="py-3 px-3 font-bold">Winner</th>
                      <th className="py-3 px-3 font-bold">Phone</th>
                      <th className="py-3 px-3 font-bold">Rank Awarded</th>
                      <th className="py-3 px-3 font-bold">Period Cycle</th>
                      <th className="py-3 px-3 font-bold">Reward Dispatched</th>
                      <th className="py-3 px-3 font-bold">Decision Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rewardLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                          No rewards dispatched yet.
                        </td>
                      </tr>
                    ) : (
                      rewardLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-3 text-gray-500">
                            {new Date(log.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3 px-3 font-bold text-gray-900">
                            {log.customerId?.name || "Customer"}
                          </td>
                          <td className="py-3 px-3 text-gray-600">
                            {log.customerId?.phone || "N/A"}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px]">
                              Rank #{log.rankPosition}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-medium text-gray-700">
                            {log.periodKey}
                          </td>
                          <td className="py-3 px-3 font-bold">
                            {log.rewardType === "FREE_ITEM" ? (
                              <span className="text-emerald-800">
                                Free Prize: {log.rewardPayload.freeItemName || "Combo Meal"} (Voucher: {log.rewardPayload.voucherCode})
                              </span>
                            ) : log.rewardType === "DISCOUNT_VOUCHER" ? (
                              <span className="text-emerald-800">
                                Voucher: {log.rewardPayload.voucherCode} (₹{log.rewardPayload.discountAmount} OFF)
                              </span>
                            ) : (
                              <span className="text-amber-800">
                                {log.rewardPayload.coins} Homely Coins
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-gray-500 italic text-[11px]">
                            {log.adminDecisionNote || "Automated Streak Payout"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tie-Breaker Decision Modal */}
        {tieModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
              <button
                onClick={() => setTieModalItem(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-extrabold text-gray-900">
                  Decide Reward for Tied Contestant
                </h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                You are reviewing <strong>{tieModalItem.customerName}</strong> ({tieModalItem.customerPhone}), who achieved a tied <strong>Rank #{tieModalItem.rank}</strong>.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Select Reward Type
                  </label>
                  <select
                    value={tieRewardType}
                    onChange={(e) => setTieRewardType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="FREE_ITEM">Free Item / Combo Meal</option>
                    <option value="DISCOUNT_VOUCHER">Discount Voucher</option>
                    <option value="COINS">Homely Coins</option>
                  </select>
                </div>

                {tieRewardType === "FREE_ITEM" ? (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">
                      Free Item / Prize Name
                    </label>
                    <input
                      type="text"
                      value={tieFreeItemName}
                      onChange={(e) => setTieFreeItemName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden"
                    />
                  </div>
                ) : tieRewardType === "DISCOUNT_VOUCHER" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 mb-1">
                        Discount (₹)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={tieDiscountAmount}
                        onChange={(e) => setTieDiscountAmount(parseInt(e.target.value, 10) || 0)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 mb-1">
                        Min Order (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={tieMinOrderAmount}
                        onChange={(e) => setTieMinOrderAmount(parseInt(e.target.value, 10) || 0)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Coins to Credit
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={tieCoinsAmount}
                      onChange={(e) => setTieCoinsAmount(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Admin Decision Note (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Approved equal reward for tied Champion"
                    value={tieDecisionNote}
                    onChange={(e) => setTieDecisionNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTieModalItem(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={tieSubmitting}
                  onClick={handleResolveTie}
                  className="px-5 py-2 rounded-xl bg-[#0B392B] hover:bg-[#0E4937] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {tieSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Approve & Dispatch Reward</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AdminBottomNav />
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Trophy,
  Crown,
  Medal,
  Flame,
  Calendar,
  Gift,
  HelpCircle,
  X,
  Sparkles,
  ShoppingBag,
  Coins,
  ChevronRight,
  TrendingUp,
  Target,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import {
  getCustomerLeaderboard,
  getLeaderboardConfig,
  CustomerLeaderboardResponse,
  LeaderboardConfigData,
} from "@/services/leaderboardService";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function LeaderboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [period, setPeriod] = useState<"weekly" | "monthly" | "all_time">("monthly");
  const [activeView, setActiveView] = useState<"top" | "your_rank">("top");
  const [data, setData] = useState<CustomerLeaderboardResponse | null>(null);
  const [config, setConfig] = useState<LeaderboardConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const [boardRes, cfgRes] = await Promise.all([
        getCustomerLeaderboard(period),
        getLeaderboardConfig(),
      ]);
      setData(boardRes);
      setConfig(cfgRes);
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const topList = data?.topLeaderboard || [];
  const userProgress = data?.userProgress;
  const isMonthlyOnly = data?.periodMode === "MONTHLY_ONLY";

  return (
    <div className="min-h-screen bg-[#F4F9FA] flex flex-col justify-between">
      <div>
        <Header />

        {/* Hero Header matching Section 6 mockup */}
        <section className="bg-gradient-to-b from-[#0B392B] via-[#0E4937] to-[#125843] text-white pt-8 pb-12 px-4 sm:px-6 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-emerald-400/15 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 -left-12 w-64 h-64 rounded-full bg-amber-400/15 blur-2xl pointer-events-none" />

          <div className="max-w-2xl mx-auto relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-amber-300 mb-3 shadow-inner">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Good Food Brings People Together</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              {isMonthlyOnly ? "Monthly Leaderboard" : "Customer Leaderboard"}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-emerald-100/90 max-w-md mx-auto">
              Your Loyalty, Our Happiness! Order, Earn, Climb & Win exclusive prizes every month.
            </p>

            {/* View Switcher: [ Top 5 ] vs [ Your Rank ] */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="inline-flex bg-black/25 p-1 rounded-2xl backdrop-blur-md border border-white/15 shadow-inner">
                <button
                  onClick={() => setActiveView("top")}
                  className={`px-5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeView === "top"
                      ? "bg-white text-[#0B392B] shadow-md"
                      : "text-emerald-100 hover:text-white"
                  }`}
                >
                  Top {config?.publicTopCount || 5}
                </button>
                <button
                  onClick={() => setActiveView("your_rank")}
                  className={`px-5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeView === "your_rank"
                      ? "bg-white text-[#0B392B] shadow-md"
                      : "text-emerald-100 hover:text-white"
                  }`}
                >
                  Your Rank
                </button>
              </div>

              <button
                onClick={() => setRulesModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-emerald-100 transition-colors border border-white/15 cursor-pointer shadow-xs"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Prizes & Rules</span>
              </button>
            </div>
          </div>
        </section>

        {/* Main Content Area */}
        <main className="max-w-2xl mx-auto px-4 sm:px-6 -mt-6 pb-28 relative z-20">
          {loading ? (
            <div className="bg-white rounded-3xl p-12 text-center shadow-xs border border-gray-100 animate-pulse">
              <Trophy className="w-10 h-10 text-emerald-300 mx-auto mb-3 animate-bounce" />
              <p className="text-sm font-semibold text-gray-500">
                Updating live rankings...
              </p>
            </div>
          ) : activeView === "top" ? (
            /* Top 5 Public Ranking List (Section 6 Mockup) */
            <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-md border border-gray-100 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 px-2">
                <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Top {config?.publicTopCount || 5} Customers
                </span>
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  Min. Order: ₹{config?.minEligibleOrderAmount || 80}
                </span>
              </div>

              {topList.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  No orders qualify yet for this period. Be the first to place an order!
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {topList.map((entry) => {
                    const isRank1 = entry.rank === 1;
                    const isRank2 = entry.rank === 2;
                    const isRank3 = entry.rank === 3;

                    return (
                      <div
                        key={entry.customerId}
                        className={`py-3.5 px-3 sm:px-4 flex items-center justify-between rounded-2xl transition-all ${
                          entry.isCurrentUser
                            ? "bg-emerald-50/90 border border-emerald-200"
                            : isRank1
                            ? "bg-amber-50/40"
                            : "hover:bg-gray-50/80"
                        }`}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          {/* Rank Badge / Medal */}
                          <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0">
                            {isRank1 ? (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-white shadow-xs">
                                <Crown className="w-4 h-4 fill-white" />
                              </div>
                            ) : isRank2 ? (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-300 to-gray-200 flex items-center justify-center text-slate-700 font-black text-xs shadow-xs">
                                #2
                              </div>
                            ) : isRank3 ? (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white font-black text-xs shadow-xs">
                                #3
                              </div>
                            ) : (
                              <span className="text-gray-400 font-black text-xs">
                                #{entry.rank}
                              </span>
                            )}
                          </div>

                          {/* Customer Short Initial Avatar & Name */}
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-[#0B392B]/10 text-[#0B392B] font-black text-xs flex items-center justify-center">
                              {entry.customerName.replace(/[^A-Za-z]/g, "").slice(0, 2) || "U"}
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-1.5">
                                <span>{entry.customerName}</span>
                                {entry.isCurrentUser && (
                                  <span className="px-1.5 py-0.5 bg-emerald-600 text-white rounded-md text-[9px] font-black tracking-wider uppercase">
                                    You
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-gray-400 font-medium">
                                {entry.completedOrdersCount} orders
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Total Eligible Spending */}
                        <div className="text-right">
                          <p className="text-xs sm:text-sm font-black text-emerald-800">
                            ₹{entry.totalSpending.toLocaleString("en-IN")}
                          </p>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                            Eligible Spend
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* "Your Rank" Dedicated View */
            <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 text-center space-y-4">
              {isAuthenticated ? (
                userProgress ? (
                  <div>
                    <div className="w-16 h-16 rounded-3xl bg-[#0B392B] text-amber-300 font-black text-2xl flex items-center justify-center mx-auto shadow-md mb-3">
                      #{userProgress.rank}
                    </div>
                    <h3 className="text-lg font-extrabold text-gray-900">
                      Your Position: Rank #{userProgress.rank}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Total Eligible Spending:{" "}
                      <strong className="text-emerald-800">
                        ₹{userProgress.totalSpending.toLocaleString("en-IN")}
                      </strong>{" "}
                      across {userProgress.completedOrdersCount} orders
                    </p>

                    {/* Gap to 1st Position Callout */}
                    {userProgress.rank > 1 && userProgress.gapToFirst > 0 ? (
                      <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
                        <div className="flex items-center justify-center gap-2 text-xs font-bold">
                          <Target className="w-4 h-4 text-amber-600" />
                          <span>Amount Needed to Reach 1st Position:</span>
                        </div>
                        <p className="text-xl font-black text-amber-800 mt-1">
                          ₹{userProgress.gapToFirst.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[11px] text-amber-700 mt-1">
                          Place more qualifying orders this month to close the gap and claim 1st prize!
                        </p>
                      </div>
                    ) : userProgress.rank === 1 ? (
                      <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                        <Crown className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                        <p className="text-sm font-black text-emerald-800">
                          You are currently holding 1st Position!
                        </p>
                        <p className="text-[11px] text-emerald-700 mt-1">
                          Defend your rank by maintaining your daily orders until the month ends.
                        </p>
                      </div>
                    ) : null}

                    {/* Streaks and Maintain Status */}
                    <div className="mt-4 grid grid-cols-2 gap-3 text-left">
                      <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Rank Maintained
                        </span>
                        <p className="text-sm font-black text-gray-800 mt-0.5">
                          {userProgress.consecutiveDaysAtCurrentRank} / {config?.positionMaintainDays || 5} days
                        </p>
                      </div>
                      <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Daily Streak
                        </span>
                        <p className="text-sm font-black text-orange-600 mt-0.5 flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 fill-orange-500" />
                          {userProgress.consecutiveOrderDays} / {config?.orderStreakDays || 5} days
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/"
                      className="mt-6 inline-flex items-center justify-center gap-2 w-full py-3 bg-[#0B392B] hover:bg-[#0E4937] text-white text-xs font-bold rounded-2xl shadow-md transition-all"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Order Now to Climb</span>
                    </Link>
                  </div>
                ) : (
                  <div className="py-6">
                    <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-gray-800">
                      You are not ranked yet for this month
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                      Place orders of ₹{config?.minEligibleOrderAmount || 80} or more to enter the leaderboard!
                    </p>
                    <Link
                      href="/"
                      className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B392B] text-white text-xs font-bold rounded-xl shadow-xs"
                    >
                      Start Ordering
                    </Link>
                  </div>
                )
              ) : (
                <div className="py-6">
                  <Crown className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-gray-800">
                    Log in to view your rank & gap to 1st place
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Sign in to track your personal streak and climb the rankings.
                  </p>
                  <Link
                    href="/login"
                    className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-[#0B392B] text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Log In Now
                  </Link>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Sticky Personalized Bottom Card with Gap to 1st (Section 6 Mockup) */}
        {isAuthenticated && userProgress && (
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-r from-[#0B392B] via-[#0E4937] to-[#125843] text-white shadow-2xl px-4 py-3 border-t border-emerald-700/50">
            <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md text-amber-300 font-black text-sm flex items-center justify-center shrink-0 border border-white/20">
                  #{userProgress.rank}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-white">Your Rank</span>
                    <span className="text-xs font-black text-emerald-300">
                      ₹{userProgress.totalSpending.toLocaleString("en-IN")}
                    </span>
                  </div>
                  {userProgress.rank > 1 && userProgress.gapToFirst > 0 ? (
                    <p className="text-[11px] text-amber-300 font-bold mt-0.5 flex items-center gap-1">
                      <Target className="w-3 h-3 text-amber-400" />
                      <span>Gap to 1st: ₹{userProgress.gapToFirst.toLocaleString("en-IN")}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-emerald-200 font-semibold mt-0.5">
                      Leading the pack! Defend your spot.
                    </p>
                  )}
                </div>
              </div>

              <Link
                href="/"
                className="shrink-0 px-4 py-2 bg-white text-[#0B392B] hover:bg-emerald-50 text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#0B392B]" />
                <span>Order Now</span>
              </Link>
            </div>
          </div>
        )}

        {/* Prizes & Rules Modal */}
        {rulesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setRulesModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-[#0B392B] mb-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-black">Monthly Rewards & Rules</h2>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Rank customers by Total Eligible Spending (excluding Homely Coins used).
              </p>

              <div className="space-y-3">
                {/* Rule 1 */}
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/60">
                  <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Eligible Spending Criteria
                  </h4>
                  <p className="text-[11px] text-emerald-800/90 mt-1 leading-relaxed">
                    • Minimum qualifying order amount: <strong>₹{config?.minEligibleOrderAmount || 80}</strong>.<br />
                    • Coins used and delivery charges are <strong>excluded</strong>.<br />
                    • Only delivered/completed orders count towards the leaderboard.
                  </p>
                </div>

                {/* Rule 2 */}
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/60">
                  <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-600" />
                    Maintain Position & Order Streak
                  </h4>
                  <p className="text-[11px] text-amber-800/90 mt-1 leading-relaxed">
                    • Defend your rank for <strong>{config?.positionMaintainDays || 5} days</strong>.<br />
                    • Maintain a daily order streak of <strong>{config?.orderStreakDays || 5} days</strong>.
                  </p>
                </div>

                {/* Prize Tiers */}
                <div className="mt-4">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Monthly Prizes
                  </h3>
                  <div className="space-y-2">
                    {config?.rewardTiers.map((tier) => (
                      <div
                        key={tier.rankPosition}
                        className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-full bg-[#0B392B] text-amber-300 font-black text-xs flex items-center justify-center">
                            #{tier.rankPosition}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-gray-800">{tier.title}</p>
                            <p className="text-[10px] text-gray-500">
                              {tier.rewardType === "FREE_ITEM"
                                ? (tier.rewardDetails.freeItemName || "Complimentary Combo Meal")
                                : tier.rewardType === "DISCOUNT_VOUCHER"
                                ? `₹${tier.rewardDetails.discountAmount} Voucher (Min order: ₹${tier.rewardDetails.minOrderAmount})`
                                : `${tier.rewardDetails.coinsAmount} Homely Coins`}
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-[#0B392B] text-[10px] font-bold">
                          {tier.rewardType === "FREE_ITEM"
                            ? "Free Prize"
                            : tier.rewardType === "DISCOUNT_VOUCHER"
                            ? "Voucher"
                            : "Coins"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setRulesModalOpen(false)}
                className="w-full mt-6 py-2.5 bg-[#0B392B] text-white rounded-xl text-xs font-bold hover:bg-[#0E4937] transition-all cursor-pointer"
              >
                Start Climbing
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Coins, ArrowUpRight, ArrowDownLeft, Clock, History, ChevronLeft, Award } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useCoins } from "@/context/CoinContext";
import { getUserCoinHistory, CoinTransactionRecord } from "@/services/coinService";
import { formatUTCToIST } from "@/utils/datetime";

export default function WalletPage() {
  const { wallet, loading: walletLoading } = useCoins();
  const [transactions, setTransactions] = useState<CoinTransactionRecord[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const res = await getUserCoinHistory(page, 10);
        setTransactions(res.transactions || []);
        setPagination(res.pagination);
      } catch (err) {
        console.error("Failed to load coin history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [page]);

  return (
    <div className="min-h-screen bg-[#FAF6ED] pb-24 flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Wallet Balance Hero Card */}
        <div className="bg-gradient-to-br from-[#0B392B] to-[#07281E] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col gap-5 border border-[#0B392B]">
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-300/30 shadow-inner">
                <Coins className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold font-poppins text-amber-300">Homely Coins</h1>
                <p className="text-[11px] text-emerald-200/80 font-medium">1 Coin = ₹1 Rewards Value</p>
              </div>
            </div>

            {wallet?.nextExpiryCheckAt && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-bold border border-white/15">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span>Expires: {formatUTCToIST(wallet.nextExpiryCheckAt).split(",")[0]}</span>
              </div>
            )}
          </div>

          <div className="z-10">
            <span className="text-xs font-extrabold text-emerald-300/80 uppercase tracking-wider block">
              Available Balance
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl sm:text-5xl font-extrabold text-white font-poppins">
                {wallet?.balance ?? 0}
              </span>
              <span className="text-sm font-bold text-amber-300">Coins (₹{wallet?.balance ?? 0})</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 z-10 text-xs">
            <div>
              <span className="text-emerald-200/70 block text-[10px]">Lifetime Earned</span>
              <span className="font-bold text-white text-sm">+{wallet?.lifetimeEarned ?? 0}</span>
            </div>
            <div>
              <span className="text-emerald-200/70 block text-[10px]">Expired Coins</span>
              <span className="font-bold text-white text-sm">-{wallet?.lifetimeExpired ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E1D3] shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[#0B392B]" />
              <h2 className="text-base sm:text-lg font-extrabold text-[#0B251C] font-poppins">
                Coin Ledger & History
              </h2>
            </div>
            <span className="text-xs text-gray-400 font-medium">Real-time ledger</span>
          </div>

          {loadingHistory ? (
            <div className="py-12 text-center text-xs font-bold text-gray-400">Loading history...</div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-xs font-bold text-gray-400">
              No coin transactions yet. Place an order or register to earn your first coins!
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {transactions.map((tx) => (
                <div key={tx._id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                        tx.direction === "CREDIT"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-red-600 border border-red-200"
                      }`}
                    >
                      {tx.direction === "CREDIT" ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <span className="font-extrabold text-[#0B251C] block text-xs sm:text-sm">
                        {tx.reason}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium mt-0.5">
                        <span>{formatUTCToIST(tx.createdAt)}</span>
                        {tx.order?.orderNumber && (
                          <span className="bg-emerald-50 text-[#0B392B] px-1.5 py-0.5 rounded-md font-mono font-bold">
                            #{tx.order.orderNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-extrabold block ${
                        tx.direction === "CREDIT" ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      {tx.direction === "CREDIT" ? `+${tx.amount}` : `-${tx.amount}`}
                    </span>
                    <span className="text-[10px] text-gray-400 block font-mono">
                      Bal: {tx.balanceAfter}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold">
              <span className="text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => prev - 1)}
                  className="px-3 py-1.5 border rounded-xl bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="px-3 py-1.5 border rounded-xl bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Coins, ArrowUpRight, ArrowDownLeft, Clock, History, RefreshCw } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import HomelyCoinCard from "@/components/HomelyCoinCard";
import { useCoins } from "@/context/CoinContext";
import { getUserCoinHistory, CoinTransactionRecord } from "@/services/coinService";
import { formatUTCToIST } from "@/utils/datetime";

export default function WalletPage() {
  const { wallet, loading: walletLoading, hasNewCoinsNotification, clearNewCoinsNotification } = useCoins();
  const [transactions, setTransactions] = useState<CoinTransactionRecord[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [showFloatingReload, setShowFloatingReload] = useState<boolean>(false);

  const fetchHistory = async (isManualReload: boolean = false) => {
    setLoadingHistory(true);
    try {
      const res = await getUserCoinHistory(page, 10);
      setTransactions(res.transactions || []);
      setPagination(res.pagination);
      if (isManualReload) {
        setShowFloatingReload(false);
        clearNewCoinsNotification();
      }
    } catch (err) {
      console.error("Failed to load coin history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page]);

  // Show floating reload button when socket credits coins while user is on wallet page
  useEffect(() => {
    if (hasNewCoinsNotification) {
      setShowFloatingReload(true);
    }
  }, [hasNewCoinsNotification]);

  return (
    <div className="min-h-screen bg-[#FAF6ED] pb-24 flex flex-col relative">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Wallet Balance Hero Card Component */}
        <HomelyCoinCard showActionLink={false} />

        {/* Transaction History Section */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E1D3] shadow-xs flex flex-col">
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
            /* Skeleton Loading State */
            <div className="flex flex-col divide-y divide-gray-100 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-gray-200 shrink-0" />
                    <div className="flex flex-col gap-1.5">
                      <div className="w-36 h-3.5 bg-gray-200 rounded-md" />
                      <div className="w-24 h-2.5 bg-gray-150 rounded-md" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="w-12 h-4 bg-gray-200 rounded-md" />
                    <div className="w-16 h-2.5 bg-gray-150 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-xs font-bold text-gray-400">
              No coin transactions yet. Place an order or register to earn your first coins!
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {transactions.map((tx) => (
                <div key={tx._id} className="py-2 flex items-center justify-between gap-3 text-xs">
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
                        {/* {tx.order?.orderNumber && (
                          <span className="bg-emerald-50 text-[#0B392B] px-1.5 py-0.5 rounded-md font-mono font-bold">
                            #{tx.order.orderNumber}
                          </span>
                        )} */}
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

      {/* Floating Bottom Middle Reload Button when new coins notification arrives */}
      {showFloatingReload && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <button
            type="button"
            onClick={() => fetchHistory(true)}
            className="bg-[#0B392B] hover:bg-[#07281E] text-white font-extrabold text-xs px-4 py-2.5 rounded-full shadow-lg border border-emerald-400/40 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            <span>New Transaction • Reload History</span>
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

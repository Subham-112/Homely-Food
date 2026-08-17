"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Loader2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import AdminBottomNav from "@/components/AdminBottomNav";
import PaymentStatusBadge from "@/components/PaymentStatusBadge";
import {
  getAdminPayments,
  getAdminPaymentAnalytics,
  initiateRefund,
  PaymentRecord,
} from "@/services/paymentService";
import { formatUTCToIST } from "@/utils/datetime";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterMethod, setFilterMethod] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  // Refund Modal State
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundReason, setRefundReason] = useState<string>("");
  const [refundSubmitting, setRefundSubmitting] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [paymentsData, analyticsData] = await Promise.all([
        getAdminPayments({
          status: filterStatus || undefined,
          method: filterMethod || undefined,
          page,
          limit: 10,
        }),
        getAdminPaymentAnalytics({
          status: filterStatus || undefined,
          method: filterMethod || undefined,
          groupBy: "method",
        }),
      ]);

      setPayments(paymentsData.payments || []);
      setPagination(paymentsData.pagination);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error("Failed to load admin payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterMethod, page]);

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;

    setRefundSubmitting(true);
    try {
      const amt = refundAmount ? parseFloat(refundAmount) : undefined;
      await initiateRefund(selectedPayment._id, { amount: amt, reason: refundReason });
      alert("Refund processed successfully!");
      setSelectedPayment(null);
      setRefundAmount("");
      setRefundReason("");
      fetchData();
    } catch (err: any) {
      alert(err?.message || "Refund initiation failed.");
    } finally {
      setRefundSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F9FA] pb-24">
      {/* Header */}
      <div className="bg-[#0B392B] text-white p-4 sm:p-6 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold font-poppins">Payments & Ledger</h1>
            <p className="text-xs text-emerald-200 mt-0.5">Real-time payment analytics, ledger & refunds</p>
          </div>
          <button
            onClick={fetchData}
            className="p-2 bg-emerald-800/60 hover:bg-emerald-800 rounded-xl transition cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-5 h-5 text-emerald-100 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 flex flex-col gap-4">
        {/* Analytics Summary Cards */}
        {analytics?.totals && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-[#E1ECEE] shadow-2xs flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gross Sales (Today)</span>
              <span className="text-lg sm:text-xl font-extrabold text-[#0B251C]">₹{analytics.totals.grossAmount || 0}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E1ECEE] shadow-2xs flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Refunded Total</span>
              <span className="text-lg sm:text-xl font-extrabold text-purple-700">₹{analytics.totals.refundedAmount || 0}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E1ECEE] shadow-2xs flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Net Received</span>
              <span className="text-lg sm:text-xl font-extrabold text-emerald-700">₹{analytics.totals.netAmount || 0}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E1ECEE] shadow-2xs flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Transactions</span>
              <span className="text-lg sm:text-xl font-extrabold text-blue-700">{analytics.totals.count || 0}</span>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white p-3 rounded-2xl border border-[#E1ECEE] shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#0B392B]" />
            <span className="text-xs font-bold text-gray-700">Filter Ledger:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 font-semibold text-gray-700 focus:outline-none focus:border-[#0B392B]"
            >
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
              <option value="partially_refunded">Partially Refunded</option>
            </select>

            <select
              value={filterMethod}
              onChange={(e) => {
                setFilterMethod(e.target.value);
                setPage(1);
              }}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 font-semibold text-gray-700 focus:outline-none focus:border-[#0B392B]"
            >
              <option value="">All Methods</option>
              <option value="razorpay">Razorpay (Online)</option>
              <option value="cod">Cash on Delivery (COD)</option>
              <option value="cash">Cash (Manual)</option>
              <option value="upi">UPI (Manual)</option>
            </select>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-2xl border border-[#E1ECEE] shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#0B392B]" />
              <span className="text-xs text-gray-500 font-semibold">Loading payment transactions...</span>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center gap-2">
              <CreditCard className="w-8 h-8 text-gray-300" />
              <span className="text-sm font-bold text-gray-600">No payment records found</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6ED] border-b border-[#E8E1D3] text-gray-500 font-extrabold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Gateway / ID</th>
                    <th className="p-3">Order Number</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Captured At</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {payments.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50/50">
                      <td className="p-3 font-mono">
                        <span className="font-bold text-[#0B251C] block">{p.gatewayOrderId}</span>
                        <span className="text-[10px] text-gray-400 block">{p.gatewayPaymentId || "-"}</span>
                      </td>
                      <td className="p-3 font-bold text-[#0B392B]">
                        {p.order?.orderNumber ? `#${p.order.orderNumber}` : "Draft (Pre-Checkout)"}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-gray-800 block">{(p.user as any)?.name || (p.order as any)?.guest?.name || "Guest"}</span>
                        <span className="text-[10px] text-gray-400 block">{(p.user as any)?.phone || (p.order as any)?.guest?.phone || ""}</span>
                      </td>
                      <td className="p-3 uppercase font-bold text-gray-600">{p.method}</td>
                      <td className="p-3 font-extrabold text-[#0B251C]">₹{p.amount}</td>
                      <td className="p-3">
                        <PaymentStatusBadge status={p.status} />
                      </td>
                      <td className="p-3 text-gray-500">
                        {p.capturedAt ? formatUTCToIST(p.capturedAt) : "-"}
                      </td>
                      <td className="p-3 text-right">
                        {(p.status === "paid" || p.status === "partially_refunded") && p.method === "razorpay" && (
                          <button
                            onClick={() => {
                              setSelectedPayment(p);
                              setRefundAmount("");
                              setRefundReason("");
                            }}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer"
                          >
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {pagination && pagination.totalPages > 1 && (
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs font-bold">
              <span className="text-gray-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setPage((prev) => prev - 1)}
                  className="px-3 py-1 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="px-3 py-1 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Refund Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRefundSubmit}
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 border border-[#E1ECEE]"
          >
            <div>
              <h2 className="text-lg font-extrabold text-[#0B251C]">Initiate Razorpay Refund</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Payment #{selectedPayment.gatewayPaymentId || selectedPayment.gatewayOrderId} (Total ₹
                {selectedPayment.amount})
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Refund Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                placeholder={`Full Amount: ₹${selectedPayment.amount}`}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B392B]"
              />
              <span className="text-[10px] text-gray-400">Leave blank to issue full refund.</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Reason</label>
              <input
                type="text"
                placeholder="e.g. Customer cancelled order / Out of stock"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B392B]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={refundSubmitting}
                className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {refundSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Refund</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <AdminBottomNav />
    </div>
  );
}

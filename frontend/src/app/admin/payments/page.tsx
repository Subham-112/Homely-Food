"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  RefreshCw,
  Filter,
  DollarSign,
  TrendingUp,
  Loader2,
} from "lucide-react";
import AdminBottomNav from "@/components/AdminBottomNav";
import PaymentStatusBadge from "@/components/PaymentStatusBadge";
import {
  getAdminPayments,
  getAdminPaymentAnalytics,
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
  const [selectedPaymentModal, setSelectedPaymentModal] = useState<PaymentRecord | null>(null);

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

  return (
    <div className="min-h-screen bg-[#FAF6ED] pb-36 sm:pb-32 p-3 sm:p-6 max-w-7xl w-full mx-auto flex flex-col gap-5 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E8E1D3] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#0B392B]" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B251C] font-poppins">
              Payment Transactions
            </h1>
          </div>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Monitor online & offline payment gateway transactions
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center justify-center gap-1.5 bg-[#0B392B] hover:bg-[#07281E] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E8E1D3] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
              Total Volume
            </span>
            <span className="text-xl font-extrabold text-[#0B251C]">
              ₹{analytics?.totals?.totalVolume ?? 0}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8E1D3] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
              Paid Success Count
            </span>
            <span className="text-xl font-extrabold text-[#0B392B]">
              {analytics?.totals?.successfulPayments ?? 0} Transactions
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#0B392B]/10 text-[#0B392B] flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8E1D3] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
              Total Recorded
            </span>
            <span className="text-xl font-extrabold text-gray-800">
              {analytics?.totals?.totalCount ?? 0} Records
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E1D3] shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mr-2">
          <Filter className="w-4 h-4 text-[#0B392B]" /> Filters:
        </div>

        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-xl bg-gray-50 text-gray-700 focus:outline-none focus:border-[#0B392B]"
        >
          <option value="">All Statuses</option>
          <option value="created">Created (Pending)</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>

        <select
          value={filterMethod}
          onChange={(e) => {
            setFilterMethod(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-xl bg-gray-50 text-gray-700 focus:outline-none focus:border-[#0B392B]"
        >
          <option value="">All Gateway Methods</option>
          <option value="razorpay">Razorpay Online</option>
          <option value="cod">Cash on Delivery</option>
          <option value="cash">Counter Cash</option>
          <option value="upi">Direct UPI</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-[#E8E1D3] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#0B392B]" />
            <span className="text-xs font-bold">Loading payment records...</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-xs font-bold">
            No payment transactions match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6ED] border-b border-[#E8E1D3] text-gray-500 font-extrabold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Gateway Order & Txn ID</th>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Captured At</th>
                  <th className="p-3 text-right">Details</th>
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
                      <span className="font-semibold text-gray-800 block">
                        {p.details?.customerDetails?.contact
                          ? p.details?.notes?.guestName || (p.user as any)?.name || "Customer"
                          : (p.user as any)?.name || (p.order as any)?.guest?.name || "Guest"}
                      </span>
                      <span className="text-[10px] text-gray-400 block font-mono">
                        {p.details?.customerDetails?.contact || (p.user as any)?.phone || (p.order as any)?.guest?.phone || "-"}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-gray-700">
                      <span className="uppercase block text-xs">{p.paymentMode || p.method}</span>
                      {p.details?.paymentMethodDetails?.bankName && (
                        <span className="text-[10px] font-semibold text-gray-400 block">
                          Bank: {p.details.paymentMethodDetails.bankName}
                        </span>
                      )}
                      {p.details?.paymentMethodDetails?.vpa && (
                        <span className="text-[10px] font-mono text-gray-400 block truncate max-w-[120px]">
                          VPA: {p.details.paymentMethodDetails.vpa}
                        </span>
                      )}
                      {p.details?.paymentMethodDetails?.cardNetwork && (
                        <span className="text-[10px] font-semibold text-gray-400 block">
                          {p.details.paymentMethodDetails.cardNetwork} •••• {p.details.paymentMethodDetails.cardLast4}
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-extrabold text-[#0B251C]">₹{p.amount}</td>
                    <td className="p-3">
                      <PaymentStatusBadge status={p.status} />
                    </td>
                    <td className="p-3 text-gray-500">
                      {p.capturedAt ? formatUTCToIST(p.capturedAt) : "-"}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedPaymentModal(p)}
                        className="bg-gray-100 hover:bg-[#0B392B] hover:text-white text-gray-700 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs font-bold pb-4">
            <span className="text-gray-500">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage((prev) => prev - 1)}
                className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                Previous
              </button>
              <button
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((prev) => prev + 1)}
                className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* High-End Admin Payment Details Modal */}
      {selectedPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 pb-20 sm:pb-4">
          <div className="bg-white rounded-3xl p-4 sm:p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4 h-[80vh] max-h-[600px] border border-[#E8E1D3] relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#0B392B]" />
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#0B251C] font-poppins">
                    Payment Gateway Details
                  </h2>
                  <p className="text-[11px] font-mono text-gray-400">
                    ID: {selectedPaymentModal.gatewayPaymentId || selectedPaymentModal.gatewayOrderId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPaymentModal(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-3.5 min-h-0 pr-0.5 text-xs">
              {/* Status Banner */}
              <div className="bg-[#FAF6ED] rounded-2xl p-3 border border-[#E8E1D3] flex items-center justify-between">
                <div>
                  <span className="text-gray-500 font-medium text-[10px] block">Amount Paid</span>
                  <span className="text-lg font-extrabold text-[#0B392B]">₹{selectedPaymentModal.amount}</span>
                </div>
                <PaymentStatusBadge status={selectedPaymentModal.status} />
              </div>

              {/* Transaction IDs */}
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col gap-1.5 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-sans">Payment ID</span>
                  <span className="font-bold text-[#0B251C]">{selectedPaymentModal.gatewayPaymentId || "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-sans">Gateway Order ID</span>
                  <span className="font-bold text-gray-800">{selectedPaymentModal.gatewayOrderId}</span>
                </div>
                {selectedPaymentModal.details?.bankRrn && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-sans">Bank RRN / UTR</span>
                    <span className="font-bold text-emerald-800">{selectedPaymentModal.details.bankRrn}</span>
                  </div>
                )}
                {selectedPaymentModal.details?.invoiceId && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-sans">Invoice ID</span>
                    <span className="font-bold text-gray-800">{selectedPaymentModal.details.invoiceId}</span>
                  </div>
                )}
              </div>

              {/* Payment Instrument & Mode */}
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col gap-1.5">
                <span className="font-extrabold text-gray-400 uppercase tracking-wider text-[9px]">
                  Payment Method Details
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Mode</span>
                  <span className="font-bold uppercase text-[#0B392B]">
                    {selectedPaymentModal.paymentMode || selectedPaymentModal.method}
                  </span>
                </div>
                {selectedPaymentModal.details?.paymentMethodDetails?.bankName && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Bank Name</span>
                    <span className="font-bold text-gray-800">{selectedPaymentModal.details.paymentMethodDetails.bankName}</span>
                  </div>
                )}
                {selectedPaymentModal.details?.paymentMethodDetails?.vpa && (
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-gray-500 font-sans">UPI VPA</span>
                    <span className="font-bold text-gray-800">{selectedPaymentModal.details.paymentMethodDetails.vpa}</span>
                  </div>
                )}
                {selectedPaymentModal.details?.paymentMethodDetails?.cardNetwork && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Card</span>
                    <span className="font-bold text-gray-800">
                      {selectedPaymentModal.details.paymentMethodDetails.cardNetwork} ({selectedPaymentModal.details.paymentMethodDetails.cardType}) •••• {selectedPaymentModal.details.paymentMethodDetails.cardLast4}
                    </span>
                  </div>
                )}
                {selectedPaymentModal.details?.paymentMethodDetails?.walletName && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Wallet</span>
                    <span className="font-bold text-gray-800">{selectedPaymentModal.details.paymentMethodDetails.walletName}</span>
                  </div>
                )}
              </div>

              {/* Customer Details */}
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col gap-1.5">
                <span className="font-extrabold text-gray-400 uppercase tracking-wider text-[9px]">
                  Customer Details
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Name</span>
                  <span className="font-bold text-[#0B251C]">
                    {selectedPaymentModal.details?.notes?.guestName || (selectedPaymentModal.user as any)?.name || (selectedPaymentModal.order as any)?.guest?.name || "Guest"}
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-gray-500 font-sans">Mobile</span>
                  <span className="font-bold text-gray-800">
                    {selectedPaymentModal.details?.customerDetails?.contact || (selectedPaymentModal.user as any)?.phone || (selectedPaymentModal.order as any)?.guest?.phone || "-"}
                  </span>
                </div>
                {(selectedPaymentModal.details?.customerDetails?.email || (selectedPaymentModal.user as any)?.email) && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Email</span>
                    <span className="font-bold text-gray-800">
                      {selectedPaymentModal.details?.customerDetails?.email || (selectedPaymentModal.user as any)?.email}
                    </span>
                  </div>
                )}
              </div>

              {/* Platform Fee & GST */}
              {selectedPaymentModal.details?.feeDetails && (
                <div className="bg-[#FAF6ED] p-3 rounded-2xl border border-[#E8E1D3] flex flex-col gap-1.5">
                  <span className="font-extrabold text-gray-400 uppercase tracking-wider text-[9px]">
                    Platform Fee & Taxes
                  </span>
                  <div className="flex items-center justify-between font-bold text-gray-800">
                    <span>Total Gateway Fee</span>
                    <span>₹{Number(selectedPaymentModal.details.feeDetails.totalFee || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500 text-[11px]">
                    <span>Razorpay Share</span>
                    <span className="font-semibold text-gray-700">₹{Number(selectedPaymentModal.details.feeDetails.razorpayFee || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500 text-[11px]">
                    <span>GST (18%)</span>
                    <span>₹{Number(selectedPaymentModal.details.feeDetails.gst || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] italic text-gray-500 border-t border-gray-200/60 pt-1 mt-0.5">
                    <span>Fee Bearer</span>
                    <span>{selectedPaymentModal.details.feeDetails.feeBearer}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-2 shrink-0 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedPaymentModal(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminBottomNav />
    </div>
  );
}

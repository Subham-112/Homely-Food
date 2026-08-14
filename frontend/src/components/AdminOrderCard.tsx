"use client";

import React, { useState } from "react";
import { Loader2, X } from "lucide-react";
import { Order, updateOrderStatus } from "@/services/orderService";
import { formatUTCToIST } from "@/utils/datetime";

interface AdminOrderCardProps {
  order: Order;
  onOrderUpdated?: (updatedOrder?: any) => void;
  onCardClick?: (orderId: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-[#FCE8E8] text-[#991B1B] border border-red-200",
  accepted: "bg-[#F5EDD6] text-[#8C6B1B] border border-yellow-200",
  preparing: "bg-[#EBF5FC] text-[#1E40AF] border border-blue-200",
  ready: "bg-purple-50 text-purple-700 border border-purple-200",
  delivered: "bg-[#EAF5EE] text-[#00875A] border border-green-200",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelled: "bg-gray-100 text-gray-500 border border-gray-200",
};

const getNextStatusAction = (order: Order): { label: string; value: string } | null => {
  const status = order.status.toLowerCase();
  const type = order.orderType;

  if (status === "pending") {
    return { label: "Accept", value: "accepted" };
  }
  if (status === "accepted") {
    return { label: "Start Preparing", value: "preparing" };
  }
  if (status === "preparing") {
    return { label: "Mark Ready", value: "ready" };
  }
  if (status === "ready") {
    if (type === "delivery") {
      return { label: "Mark Delivered", value: "delivered" };
    } else {
      return { label: "Complete Order", value: "completed" };
    }
  }
  return null;
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const time = date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return `Today, ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return `Yesterday, ${time}`;

  return `${date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  })}, ${time}`;
}

export default function AdminOrderCard({ order, onOrderUpdated, onCardClick }: AdminOrderCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string>("");
  const [isPaidSelection, setIsPaidSelection] = useState<boolean>(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");

  const isPaid = order.payment?.status?.toLowerCase() === "paid";
  const nextAction = getNextStatusAction(order);

  let typeColorClass = "bg-orange-50 text-orange-700 border-orange-200";
  if (order.orderType === "delivery") {
    typeColorClass = "bg-blue-50 text-blue-700 border-blue-200";
  } else if (order.orderType === "pickup") {
    typeColorClass = "bg-purple-50 text-purple-700 border-purple-200";
  }

  const handleUpdateStatus = async (
    newStatus: string,
    paymentMethod?: string,
    isPaidVal?: boolean
  ) => {
    setIsUpdating(true);
    try {
      const updatedOrder = await updateOrderStatus(order._id, newStatus, paymentMethod, isPaidVal);

      if (onOrderUpdated) {
        onOrderUpdated(updatedOrder);
      }
    } catch (err: any) {
      console.error("Failed to update status:", err);
      alert(err?.message || "Failed to update order status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePaymentConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowPaymentModal(false);
    await handleUpdateStatus(targetStatus, selectedPaymentMethod, isPaidSelection);
  };

  return (
    <>
      <div
        onClick={() => onCardClick && onCardClick(order._id)}
        className={`rounded-2xl p-4 border flex flex-col justify-between gap-3 transition-all cursor-pointer ${
          isPaid
            ? "bg-gray-50 border-gray-200 opacity-70 saturate-50 shadow-none hover:shadow-xs"
            : "bg-white border-[#E1ECEE] shadow-2xs hover:shadow-xs hover:border-[#0B392B]/40"
        }`}
      >
        {/* Card Header: Order Number & Status */}
        <div className="flex items-center justify-between border-b border-gray-100/60 pb-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-[#0B251C]">{order.orderNumber}</span>
            {/* Order Type Badge */}
            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold border uppercase tracking-wider ${typeColorClass}`}>
              {order.orderType === "dine-in" ? "normally" : order.orderType}
            </span>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shrink-0 ${
              STATUS_STYLES[order.status] || "bg-gray-100 text-gray-600"
            }`}
          >
            {order.status}
          </span>
        </div>

        {/* Customer Info & Price/Paid Tag */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <div className="text-[11px] font-semibold text-gray-500 flex items-center gap-1.5">
              <span className="text-[#0B392B] font-bold">{order.guest?.name || "Guest"}</span>
              {order.guest?.phone && (
                <>
                  <span className="text-gray-300 font-normal">|</span>
                  <span className="font-mono text-gray-400">{order.guest.phone}</span>
                </>
              )}
            </div>
            {/* Meta Created At Time */}
            <span className="text-[10px] text-gray-400 font-medium">
              🕐 {formatDate(order.createdAt)}
            </span>
          </div>

          {/* Price & Paid Indicator on Right */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-extrabold text-sm text-[#0B251C]">₹{order.totalAmount}</span>
            {isPaid && (
              <span className="bg-emerald-600 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 tracking-wider uppercase shadow-3xs">
                ✓ Paid
              </span>
            )}
          </div>
        </div>

        {/* Horizontal Items Scroller */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1 shrink-0">
          {order.items.map((item, idx) => (
            <span
              key={idx}
              className="inline-block bg-emerald-50 text-[#0B392B] text-[10px] font-bold px-2 py-1 rounded-lg border border-emerald-100/60 whitespace-nowrap shrink-0"
            >
              {item.quantity}x {item.menuItem.name}
            </span>
          ))}
        </div>

        {/* Conditional Delivery / Pickup details */}
        {(order.orderType === "delivery" && order.deliveryAddress) || (order.orderType === "pickup" && order.pickupTiming) ? (
          <div className="text-[10px] text-gray-500 leading-normal bg-gray-50/50 p-2 rounded-xl border border-gray-100/50">
            {order.orderType === "delivery" && (
              <div className="truncate">
                <span className="font-bold text-gray-600">Address:</span> {order.deliveryAddress}
              </div>
            )}
            {order.orderType === "pickup" && (
              <div>
                <span className="font-bold text-gray-600">Pickup timing:</span> {formatUTCToIST(order.pickupTiming)}
              </div>
            )}
          </div>
        ) : null}

        {/* Footer: Full Width Action Button / Status */}
        <div className="border-t border-gray-100/80 mt-0.5" onClick={(e) => e.stopPropagation()}>
          {nextAction ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const targetVal = nextAction.value;
                if (targetVal === "completed" || targetVal === "delivered") {
                  setTargetStatus(targetVal);
                  setIsPaidSelection(true);
                  setSelectedPaymentMethod("");
                  setShowPaymentModal(true);
                } else {
                  handleUpdateStatus(targetVal);
                }
              }}
              disabled={isUpdating}
              className="w-full bg-[#0B392B] hover:bg-[#07281E] text-white font-extrabold text-[11px] py-2 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isUpdating && <Loader2 className="w-3 h-3 animate-spin" />}
              {nextAction.label}
            </button>
          ) : (
            <div className="w-full bg-gray-100 text-gray-500 font-extrabold text-[11px] py-2 rounded-xl text-center tracking-wide uppercase border border-gray-200/60">
              Completed
            </div>
          )}
        </div>
      </div>

      {/* Payment Confirmation Modal encapsulated inside the card */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <form
            onSubmit={handlePaymentConfirm}
            className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#0B251C]">
                  Payment Status & Complete
                </h2>
                <p className="text-[11px] text-gray-400">
                  Update payment details for order {order.orderNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Paid / Unpaid Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Payment Status *
              </label>
              <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setIsPaidSelection(true)}
                  className={`py-2 rounded-lg text-center cursor-pointer transition-all ${
                    isPaidSelection
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Paid
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaidSelection(false)}
                  className={`py-2 rounded-lg text-center cursor-pointer transition-all ${
                    !isPaidSelection
                      ? "bg-red-600 text-white shadow-xs"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Unpaid
                </button>
              </div>
            </div>

            {/* Payment Method Select Buttons */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Payment Method *
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                {([
                  { label: "💵 Cash", value: "cash" },
                  { label: "📱 UPI", value: "upi" }
                ]).map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setSelectedPaymentMethod(method.value)}
                    className={`py-2 px-3 border rounded-xl text-center cursor-pointer transition-all ${
                      selectedPaymentMethod === method.value
                        ? "bg-[#0B392B] text-white border-[#0B392B] shadow-xs"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#0B392B] hover:bg-[#07281E] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
              >
                Confirm & Complete
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

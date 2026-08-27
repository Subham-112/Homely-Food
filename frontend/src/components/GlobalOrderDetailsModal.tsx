"use client";

import React from "react";
import {
  Receipt,
  X,
  MapPin,
  Calendar,
  User,
  Phone,
  Tag,
} from "lucide-react";
import VegBadge from "@/components/VegBadge";
import { Order } from "@/services/orderService";
import { formatUTCToIST } from "@/utils/datetime";

interface GlobalOrderDetailsModalProps {
  order: Order | null;
  variant: "user" | "admin";
  onClose: () => void;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function GlobalOrderDetailsModal({
  order,
  variant,
  onClose,
}: GlobalOrderDetailsModalProps) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl p-3.5 sm:p-5 max-w-md w-full shadow-2xl flex flex-col gap-3 h-[75vh] max-h-[580px] sm:max-h-[640px] border border-[#E8E1D3] relative animate-in fade-in zoom-in-95 duration-200">
        {/* Fixed Modal Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <Receipt className="w-4.5 h-4.5 text-[#0B392B]" />
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-[#0B251C] font-poppins">
                Order #{order.orderNumber || order._id}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-3 min-h-0 pr-0.5">
          {/* Status & Timing Banner */}
          <div className="bg-[#FAF6ED] rounded-2xl p-2.5 sm:p-3 border border-[#E8E1D3] flex items-center justify-between text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-gray-500 font-medium text-[10px]">Placed On</span>
              <span className="font-bold text-[#0B251C] text-[11px]">
                {variant === "admin"
                  ? formatUTCToIST(order.createdAt)
                  : `${formatDate(order.createdAt)} at ${formatTime(order.createdAt)}`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0B392B] text-white uppercase tracking-wider">
                {order.status}
              </span>
            </div>
          </div>

          {/* Customer Metadata (Admin Variant Only) */}
          {variant === "admin" && (
            <div className="bg-[#FAF6ED] p-3 rounded-2xl border border-[#E8E1D3] flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#0B392B]" /> Customer:
                </span>
                <span className="font-extrabold text-[#0B251C]">
                  {order.guest?.name || "Customer"}
                </span>
              </div>

              {order.guest?.phone && (
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#0B392B]" /> Phone:
                  </span>
                  <span className="font-mono font-bold text-gray-800">
                    {order.guest.phone}
                  </span>
                </div>
              )}

              {order.guest?.email && (
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-500 flex items-center gap-1.5">
                    📧 Email:
                  </span>
                  <span className="font-medium text-gray-700">
                    {order.guest.email}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Order Type & Address Details */}
          <div className="flex flex-col gap-1.5 bg-gray-50 p-2.5 sm:p-3 rounded-2xl border border-gray-100 text-xs">
            <div className={`flex items-center justify-between font-bold text-gray-700 ${order.deliveryAddress && "border-b border-gray-200/60 pb-1.5"}`}>
              <span className="text-[11px] flex items-center gap-1">
                {variant === "admin" && <Tag className="w-3.5 h-3.5 text-[#0B392B]" />} Order Type
              </span>
              <span className="capitalize text-[#0B392B] bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 text-[10px]">
                {order.orderType === "dine-in" ? (variant === "admin" ? "normally (dine-in)" : "dine-in") : order.orderType}
              </span>
            </div>

            {order.deliveryAddress && (
              <div className="flex flex-col gap-0.5 pt-0.5 text-gray-600">
                <span className="font-bold text-gray-700 text-[11px] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#0B392B]" /> Delivery Address:
                </span>
                <p className="pl-4 text-gray-500 leading-snug font-medium text-[11px]">
                  {order.deliveryAddress}
                </p>
              </div>
            )}

            {order.pickupTiming && (
              <div className="flex items-center justify-between pt-0.5 text-gray-600">
                <span className="font-bold text-gray-700 text-[11px] flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#0B392B]" /> Pickup Timing:
                </span>
                <span className="font-semibold text-gray-800 text-[11px]">
                  {formatUTCToIST(order.pickupTiming)}
                </span>
              </div>
            )}

            {order.notes && (
              <div className="flex flex-col gap-0.5 pt-1 border-t border-gray-200/60 text-gray-600">
                <span className="font-bold text-gray-700 text-[11px]">Special Notes:</span>
                <p className="text-gray-500 font-medium italic text-[11px]">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Status Timeline Container (Preparing, Ready, Completed in IST format) */}
          {(order.preparingAt || order.readyAt || order.completedAt) && (
            <div className="flex flex-col gap-1.5 bg-[#FAF6ED] p-2.5 sm:p-3 rounded-2xl border border-[#E8E1D3] text-xs">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                Status Timeline
              </span>
              <div className="flex flex-col gap-1 pt-0.5">
                {order.preparingAt && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                      🍳 Preparing:
                    </span>
                    <span className="font-semibold text-gray-800 font-mono text-[11px]">
                      {formatUTCToIST(order.preparingAt)}
                    </span>
                  </div>
                )}
                {order.readyAt && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-purple-900 flex items-center gap-1.5">
                      🛍️ Ready for Pickup:
                    </span>
                    <span className="font-semibold text-gray-800 font-mono text-[11px]">
                      {formatUTCToIST(order.readyAt)}
                    </span>
                  </div>
                )}
                {order.completedAt && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      ✅ Completed:
                    </span>
                    <span className="font-semibold text-gray-800 font-mono text-[11px]">
                      {formatUTCToIST(order.completedAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Items Breakdown List */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
              Ordered Items ({order.items?.length || 0})
            </span>
            <div className="flex flex-col gap-1.5 bg-white rounded-2xl border border-gray-200/70 p-2.5">
              {order.items?.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-2">
                    <VegBadge size={12} />
                    <div className="flex flex-col min-w-0">
                      <span className="font-extrabold text-[#0B251C] truncate text-[11px]">
                        {item.menuItem?.name || item.name || "Item"}
                      </span>
                      {item.variant && (
                        <span className="text-[10px] text-gray-400 font-semibold">
                          Variant: {item.variant.label}
                        </span>
                      )}
                    </div>
                    <span className="text-gray-400 font-bold text-[10px] ml-auto pr-2">
                      x{item.quantity}
                    </span>
                  </div>
                  <span className="font-extrabold text-[#0B251C] shrink-0 text-[11px]">
                    ₹{(item.price || item.menuItem?.price || 0) * item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial & Payment Summary */}
          <div className="flex flex-col gap-1 bg-[#FAF6ED] p-2.5 sm:p-3 rounded-2xl border border-[#E8E1D3] text-xs text-gray-600">
            <span className="font-extrabold text-gray-400 uppercase tracking-wider text-[9px] pb-1 border-b border-gray-200/70 mb-0.5">
              Payment Breakdown
            </span>
            <div className="flex items-center justify-between">
              <span className="text-[11px]">Subtotal</span>
              <span className="font-bold text-gray-800 text-[11px]">
                ₹{order.payment?.subTotal ?? order.subTotal ?? order.totalAmount ?? 0}
              </span>
            </div>
            {Boolean(order.payment?.discount || order.discount) && (
              <div className="flex items-center justify-between text-emerald-700">
                <span className="text-[11px]">Discount</span>
                <span className="font-bold text-[11px]">
                  -₹{order.payment?.discount ?? order.discount ?? 0}
                </span>
              </div>
            )}
            {(order.orderType === "delivery" || (order.payment?.deliveryCharge !== undefined && order.payment?.deliveryCharge > 0) || (order.deliveryCharge !== undefined && order.deliveryCharge > 0)) && (
              <div className="flex items-center justify-between text-gray-600">
                <span className="text-[11px]">Delivery Charge</span>
                <span className="font-bold text-gray-800 text-[11px]">
                  {(order.payment?.deliveryCharge ?? order.deliveryCharge ?? 0) === 0 ? (
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">FREE</span>
                  ) : (
                    `₹${order.payment?.deliveryCharge ?? order.deliveryCharge ?? 0}`
                  )}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[11px]">Payment Mode</span>
              <span className="font-bold text-gray-800 uppercase text-[10px] tracking-wider px-2 py-0.5 bg-white rounded border border-gray-200">
                {order.payment?.mode || (order as any).paymentPreference || "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px]">Payment Status</span>
              <span
                className={`font-bold capitalize text-[11px] ${
                  order.payment?.status === "paid" ? "text-emerald-700" : "text-amber-600"
                }`}
              >
                {order.payment?.status || "unpaid"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm font-extrabold text-[#0B251C] pt-2 border-t border-gray-300/70 mt-1">
              <span>Total Amount</span>
              <span className="text-[#0B392B] text-base">₹{order.payment.totalAmount}</span>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-[#0B392B] hover:bg-[#07281E] text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

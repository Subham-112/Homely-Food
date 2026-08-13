"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  CookingPot,
  ChevronRight,
  RotateCcw,
  Loader2,
  X,
  MapPin,
  Calendar,
  Receipt,
  Utensils,
  Eye,
} from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import VegBadge from "@/components/VegBadge";
import Button from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { getMyOrders, Order } from "@/services/orderService";
import { formatUTCToIST } from "@/utils/datetime";
import { useSocket } from "@/context/SocketContext";

export default function OrdersPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { socket } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | "Active" | "Completed">("All");

  // Selected Order for Details Modal
  const [selectedOrderModal, setSelectedOrderModal] = useState<Order | null>(null);

  // Socket Real-Time Status Listener
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (updatedOrder: any) => {
      console.log("📢 Real-Time Socket Event in User Orders List:", updatedOrder);
      const targetId = updatedOrder._id || updatedOrder.orderNumber;
      setOrders((prev) =>
        prev.map((o) =>
          o._id === targetId || o.orderNumber === targetId
            ? { ...o, status: updatedOrder.status }
            : o
        )
      );
    };

    socket.on("order:status_updated", handleStatusUpdate);

    return () => {
      socket.off("order:status_updated", handleStatusUpdate);
    };
  }, [socket]);

  useEffect(() => {
    const fetchUserOrders = async () => {
      setLoading(true);
      try {
        if (token) {
          // Fetch raw orders directly from backend API
          const resOrders = await getMyOrders();
          setOrders(resOrders || []);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error("Failed to fetch user orders via getMyOrders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserOrders();
  }, [token]);

  const filteredOrders = orders.filter((order) => {
    const isOrderActive =
      order.status.toLowerCase() === "pending" ||
      order.status.toLowerCase() === "accepted" ||
      order.status.toLowerCase() === "preparing" ||
      order.status.toLowerCase() === "ready";

    if (filter === "Active") return isOrderActive;
    if (filter === "Completed")
      return order.status.toLowerCase() === "completed" || order.status.toLowerCase() === "delivered";
    return true;
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#FAF6ED] relative">
      {/* Fixed Top Header */}
      <Header />

      {/* Middle Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-5 max-w-4xl w-full mx-auto flex flex-col gap-4 pb-24">
        <div className="flex items-center justify-between px-0.5">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B251C] font-poppins">
            My Orders
          </h1>
          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#0B392B]/10 text-[#0B392B]">
            {orders.length} {orders.length === 1 ? "Order" : "Orders"}
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 shrink-0">
          {(["All", "Active", "Completed"] as const).map((tab) => {
            const isActive = filter === tab;
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#0B392B] text-white shadow-xs"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-[#0B392B]"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Order Cards List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#0B392B]" />
            <span className="text-xs font-semibold">Fetching your orders...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#E8E1D3] flex flex-col items-center justify-center gap-4 shadow-xs my-2">
            <Clock className="w-12 h-12 text-gray-300" />
            <p className="text-gray-600 font-bold text-base">No orders found</p>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              You don't have any {filter !== "All" ? filter.toLowerCase() : ""} orders yet. Explore our menu to place your first order!
            </p>
            <Link href="/">
              <Button variant="primary" fullWidth={false}>
                Explore Menu
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {filteredOrders.map((order) => {
              console.log("order details", order);
              const statusLower = order.status.toLowerCase();
              const isActiveOrder =
                statusLower === "pending" ||
                statusLower === "accepted" ||
                statusLower === "preparing" ||
                statusLower === "ready";

              return (
                <div
                  key={order._id}
                  onClick={() => setSelectedOrderModal(order)}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E1D3] shadow-xs hover:shadow-md hover:border-[#0B392B]/40 transition-all flex flex-col justify-between gap-3.5 cursor-pointer group"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm sm:text-base text-[#0B251C] font-mono">
                          #{order.orderNumber}
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase tracking-wider">
                          {order.orderType === "dine-in" ? "Normally" : order.orderType}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 font-medium">
                        {formatDate(order.createdAt)} • {formatTime(order.createdAt)}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 shrink-0 ${
                        isActiveOrder
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {isActiveOrder ? (
                        <CookingPot className="w-3.5 h-3.5 animate-pulse text-amber-600" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span className="capitalize">{order.status}</span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="flex flex-col gap-2 flex-1">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs sm:text-sm text-gray-800"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                          <VegBadge size={14} />
                          <span className="font-semibold truncate">
                            {item.name} x {item.quantity}
                          </span>
                        </div>
                        <span className="font-extrabold text-[#0B251C] shrink-0">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Conditional Details Pill */}
                  {order.orderType === "delivery" && order.deliveryAddress && (
                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs text-gray-600 truncate">
                      <span className="font-bold text-gray-700">Delivery: </span>
                      {order.deliveryAddress}
                    </div>
                  )}

                  {/* Card Footer */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-1">
                    <div>
                      <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                        Total Paid
                      </span>
                      <span className="text-base sm:text-lg font-extrabold text-[#0B392B]">
                        ₹{order.totalAmount}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrderModal(order);
                        }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>

                      {isActiveOrder ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/order-tracking?order=${order._id}`);
                          }}
                          className="bg-[#0B392B] hover:bg-[#07281E] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          Track <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push("/cart");
                          }}
                          className="border border-[#0B392B] text-[#0B392B] hover:bg-[#0B392B] hover:text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Reorder
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* High-End Order Details Modal */}
      {selectedOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto border border-[#E8E1D3] relative animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#0B392B]" />
                <h2 className="text-base sm:text-lg font-extrabold text-[#0B251C] font-poppins">
                  Order #{selectedOrderModal.orderNumber}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrderModal(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status & Timing Banner */}
            <div className="bg-[#FAF6ED] rounded-2xl p-3.5 border border-[#E8E1D3] flex items-center justify-between text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="text-gray-500 font-medium">Placed On</span>
                <span className="font-bold text-[#0B251C]">
                  {formatDate(selectedOrderModal.createdAt)} at {formatTime(selectedOrderModal.createdAt)}
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#0B392B] text-white uppercase tracking-wider">
                {selectedOrderModal.status}
              </span>
            </div>

            {/* Order Type & Address Details */}
            <div className="flex flex-col gap-2 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-xs">
              <div className="flex items-center justify-between font-bold text-gray-700 border-b border-gray-200/60 pb-2">
                <span>Order Type</span>
                <span className="capitalize text-[#0B392B]">
                  {selectedOrderModal.orderType === "dine-in" ? "Normally / Dine-in" : selectedOrderModal.orderType}
                </span>
              </div>

              {selectedOrderModal.deliveryAddress && (
                <div className="flex flex-col gap-0.5 pt-1 text-gray-600">
                  <span className="font-bold text-gray-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#0B392B]" /> Delivery Address:
                  </span>
                  <p className="pl-4 text-gray-500 leading-relaxed font-medium">
                    {selectedOrderModal.deliveryAddress}
                  </p>
                </div>
              )}

              {selectedOrderModal.pickupTiming && (
                <div className="flex items-center justify-between pt-1 text-gray-600">
                  <span className="font-bold text-gray-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#0B392B]" /> Pickup Timing:
                  </span>
                  <span className="font-semibold text-gray-800">
                    {formatUTCToIST(selectedOrderModal.pickupTiming)}
                  </span>
                </div>
              )}
            </div>

            {/* Items Breakdown List */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                Ordered Items ({selectedOrderModal.items.length})
              </span>
              <div className="flex flex-col gap-2 bg-white rounded-2xl border border-gray-200/70 p-3">
                {selectedOrderModal.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                      <VegBadge size={14} />
                      <span className="font-extrabold text-[#0B251C] truncate">
                        {item.name}
                      </span>
                      <span className="text-gray-400 font-bold text-[11px]">
                        x{item.quantity}
                      </span>
                    </div>
                    <span className="font-extrabold text-[#0B251C] shrink-0">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-100 text-xs text-gray-600">
              <div className="flex items-center justify-between">
                <span>Payment Method</span>
                <span className="font-bold text-gray-800">{selectedOrderModal.payment?.method || "cash"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Payment Status</span>
                <span className="font-bold text-emerald-700 capitalize">{selectedOrderModal.payment?.status || "pending"}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-extrabold text-[#0B251C] pt-2 border-t border-gray-200">
                <span>Total Amount Paid</span>
                <span className="text-[#0B392B] text-base">₹{selectedOrderModal.totalAmount}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  const idToTrack = selectedOrderModal.orderNumber;
                  setSelectedOrderModal(null);
                  router.push(`/order-tracking?orderId=${idToTrack}`);
                }}
                className="flex-1 bg-[#0B392B] hover:bg-[#07281E] text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Utensils className="w-4 h-4 text-[#FFCC00]" />
                <span>Track Order Real-Time</span>
              </button>

              <button
                onClick={() => setSelectedOrderModal(null)}
                className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

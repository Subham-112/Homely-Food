"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FileText, Clock, CookingPot, ChevronRight, Loader2, CheckCircle2, Radio, X, User, Phone, Tag, MapPin, Calendar, CreditCard } from "lucide-react";
import Header from "@/components/Header";
import AdminBottomNav from "@/components/AdminBottomNav";
import AdminOrderCard from "@/components/AdminOrderCard";
import VegBadge from "@/components/VegBadge";
import { getOrderStats, getOrders, getOrderById, OrderStats, Order } from "@/services/orderService";
import { formatUTCToIST } from "@/utils/datetime";
import { useSocket } from "@/context/SocketContext";

export default function AdminHomePage() {
  const { socket, joinAdminRoom } = useSocket();
  const [stats, setStats] = useState<OrderStats>({ total: 0, pending: 0, preparing: 0, completed: 0 });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderModal, setSelectedOrderModal] = useState<Order | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsData, ordersData] = await Promise.all([
        getOrderStats({ period: "today" }),
        getOrders({ page: 1, limit: 5, period: "today" }),
      ]);
      setStats(statsData);
      setOrders(ordersData.orders || []);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Data Fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-Time Socket.io Listeners (Replaces old 5-minute timer polling)
  useEffect(() => {
    joinAdminRoom();

    if (!socket) return;

    const handleNewOrder = () => {
      console.log("📢 Real-Time New Order Socket Event: Refetching live stats...");
      fetchDashboardData();
    };

    const handleStatusUpdate = (updatedOrder: any) => {
      console.log("📢 Real-Time Status Update Event: Updating local state...");
      if (updatedOrder && (updatedOrder._id || updatedOrder.id)) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === updatedOrder._id || o._id === updatedOrder.id
              ? { ...o, ...updatedOrder }
              : o
          )
        );
      }
      // Re-fetch aggregate stats only once
      getOrderStats({ period: "today" }).then(setStats).catch(console.error);
    };

    socket.on("order:new", handleNewOrder);
    socket.on("order:status_updated", handleStatusUpdate);

    return () => {
      socket.off("order:new", handleNewOrder);
      socket.off("order:status_updated", handleStatusUpdate);
    };
  }, [socket, joinAdminRoom, fetchDashboardData]);

  const handleOpenOrderModal = async (orderId: string) => {
    setModalLoading(true);
    setSelectedOrderModal(null);
    try {
      const details = await getOrderById(orderId);
      setSelectedOrderModal(details);
    } catch (err: any) {
      alert(err?.message || "Failed to load order details.");
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#F4F8FA] relative">
      {/* Header */}
      <Header />

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-5 max-w-5xl w-full mx-auto flex flex-col gap-5 pb-20">
        {/* Title & Live Status */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B251C] font-poppins">
            Overview
          </h1>
          <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1.5 shadow-2xs">
            <Radio className="w-3 h-3 text-emerald-600 animate-pulse" /> Live Socket Sync
          </span>
        </div>

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Today's Orders */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                TODAY'S ORDERS
              </span>
              <span className="text-2xl font-extrabold text-[#0B251C] mt-0.5 block">
                {loading ? "..." : stats.total}
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#E2EAF0] text-[#0B392B] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Pending */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                PENDING
              </span>
              <span className="text-2xl font-extrabold text-[#C51E1E] mt-0.5 block">
                {loading ? "..." : stats.pending}
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#FCE8E8] text-[#C51E1E] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Preparing */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                PREPARING
              </span>
              <span className="text-2xl font-extrabold text-[#8C6B1B] mt-0.5 block">
                {loading ? "..." : stats.preparing}
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#F7EFE0] text-[#8C6B1B] flex items-center justify-center shrink-0">
              <CookingPot className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Completed */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                COMPLETED
              </span>
              <span className="text-2xl font-extrabold text-[#00875A] mt-0.5 block">
                {loading ? "..." : stats.completed}
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#EAF5EE] text-[#00875A] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Today's Orders Section */}
        <div className="flex flex-col gap-3 mt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0B251C]">Today's Orders</h2>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-[#0B392B] hover:underline flex items-center gap-0.5"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-[#0B392B]" />
              <span className="text-xs font-semibold">Loading orders...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 text-gray-500 font-medium text-xs">
              No orders placed today.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order) => (
                <AdminOrderCard
                  key={order._id}
                  order={order}
                  onOrderUpdated={(updated) => {
                    if (updated && (updated._id || updated.id)) {
                      setOrders((prev) =>
                        prev.map((o) =>
                          o._id === updated._id || o._id === updated.id
                            ? { ...o, ...updated }
                            : o
                        )
                      );
                    }
                  }}
                  onCardClick={handleOpenOrderModal}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Spacer */}
        <div className="h-8 shrink-0" />
      </div>

      {/* Order Details Modal (API Fetched) */}
      {(modalLoading || selectedOrderModal) && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          {modalLoading ? (
            <div className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#0B392B]" />
              <p className="text-xs font-bold text-[#0B251C]">Fetching order details from API...</p>
            </div>
          ) : selectedOrderModal ? (
            <div className="bg-white rounded-xl max-w-lg w-full p-4 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-extrabold text-[#0B251C]">
                      Order #{selectedOrderModal.orderNumber || selectedOrderModal._id}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {selectedOrderModal.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                    Placed on {formatUTCToIST(selectedOrderModal.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrderModal(null)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer & Order Metadata Box */}
              <div className="bg-[#FAF6ED] p-3.5 rounded-2xl border border-[#E8E1D3] flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-500 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#0B392B]" /> Customer:
                  </span>
                  <span className="font-extrabold text-[#0B251C]">
                    {selectedOrderModal.guest?.name || "Customer"}
                  </span>
                </div>

                {selectedOrderModal.guest?.phone && (
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#0B392B]" /> Phone:
                    </span>
                    <span className="font-mono font-bold text-gray-800">
                      {selectedOrderModal.guest.phone}
                    </span>
                  </div>
                )}

                {selectedOrderModal.guest?.email && (
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-500 flex items-center gap-1.5">
                      📧 Email:
                    </span>
                    <span className="font-medium text-gray-700">
                      {selectedOrderModal.guest.email}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-gray-200/60 pt-2 mt-1">
                  <span className="font-bold text-gray-500 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#0B392B]" /> Order Type:
                  </span>
                  <span className="font-extrabold text-[#0B251C] uppercase text-[10px] tracking-wider px-2 py-0.5 bg-white rounded-md border border-gray-200">
                    {selectedOrderModal.orderType === "dine-in" ? "normally (dine-in)" : selectedOrderModal.orderType}
                  </span>
                </div>

                {selectedOrderModal.deliveryAddress && (
                  <div className="border-t border-gray-200/60 pt-2 mt-0.5">
                    <span className="font-bold text-gray-500 flex items-center gap-1.5 mb-0.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0B392B]" /> Delivery Address:
                    </span>
                    <p className="pl-5 text-gray-700 leading-relaxed font-medium">
                      {selectedOrderModal.deliveryAddress}
                    </p>
                  </div>
                )}

                {selectedOrderModal.pickupTiming && (
                  <div className="flex items-center justify-between border-t border-gray-200/60 pt-2 mt-0.5">
                    <span className="font-bold text-gray-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#0B392B]" /> Pickup Timing:
                    </span>
                    <span className="font-semibold text-gray-800">
                      {formatUTCToIST(selectedOrderModal.pickupTiming)}
                    </span>
                  </div>
                )}
              </div>

              {/* Order Items Breakdown */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                  Order Items ({selectedOrderModal.items?.length || 0})
                </span>
                <div className="flex flex-col gap-2 bg-gray-50 rounded-2xl border border-gray-200/80 p-3 max-h-48 overflow-y-auto">
                  {selectedOrderModal.items?.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1.5 border-b border-gray-200/60 last:border-b-0"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                        <VegBadge size={14} />
                        <div className="flex flex-col">
                          <span className="font-extrabold text-[#0B251C] truncate">
                            {item.menuItem?.name || item.name || "Item"}
                          </span>
                          {item.variant && (
                            <span className="text-[10px] text-gray-400 font-semibold">
                              Variant: {item.variant.label}
                            </span>
                          )}
                        </div>
                        <span className="text-gray-400 font-bold text-[11px] ml-auto pr-2">
                          x{item.quantity}
                        </span>
                      </div>
                      <span className="font-extrabold text-[#0B251C] shrink-0">
                        ₹{(item.price || item.menuItem?.price || 0) * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial & Payment Breakdown */}
              <div className="flex flex-col gap-1.5 bg-[#FAF6ED] p-3.5 rounded-2xl border border-[#E8E1D3] text-xs">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-800">₹{selectedOrderModal.subTotal || selectedOrderModal.totalAmount}</span>
                </div>
                {selectedOrderModal.discount && selectedOrderModal.discount > 0 && (
                  <div className="flex items-center justify-between text-emerald-700">
                    <span>Discount</span>
                    <span className="font-bold">-₹{selectedOrderModal.discount}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#0B392B]" /> Payment Method
                  </span>
                  <span className="font-bold text-gray-800 uppercase text-[10px] tracking-wider px-2 py-0.5 bg-white rounded border border-gray-200">
                    {selectedOrderModal.payment?.method || "Not set"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>Payment Status</span>
                  <span className={`font-bold capitalize ${selectedOrderModal.payment?.status === "paid" ? "text-emerald-700" : "text-amber-600"}`}>
                    {selectedOrderModal.payment?.status || "unpaid"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm font-extrabold text-[#0B251C] pt-2 border-t border-gray-300/70 mt-1">
                  <span>Total Amount</span>
                  <span className="text-[#0B392B] text-base">₹{selectedOrderModal.totalAmount}</span>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedOrderModal(null)}
                  className="w-full bg-[#0B392B] hover:bg-[#07281E] text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Pinned Bottom Nav with Home Tab Active */}
      <AdminBottomNav />
    </div>
  );
}

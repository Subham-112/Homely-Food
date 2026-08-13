"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FileText, Clock, CookingPot, ChevronRight, Loader2, CheckCircle2, Radio } from "lucide-react";
import Header from "@/components/Header";
import AdminBottomNav from "@/components/AdminBottomNav";
import AdminOrderCard from "@/components/AdminOrderCard";
import { getOrderStats, getOrders, OrderStats, Order } from "@/services/orderService";
import { useSocket } from "@/context/SocketContext";

export default function AdminHomePage() {
  const { socket, joinAdminRoom } = useSocket();
  const [stats, setStats] = useState<OrderStats>({ total: 0, pending: 0, preparing: 0, completed: 0 });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsData, ordersData] = await Promise.all([
        getOrderStats(),
        getOrders({ page: 1, limit: 5 }),
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

    const handleRealTimeUpdate = () => {
      console.log("📢 Real-Time Socket Event in Admin Dashboard: Refetching live stats...");
      fetchDashboardData();
    };

    socket.on("order:new", handleRealTimeUpdate);
    socket.on("order:status_updated", handleRealTimeUpdate);

    return () => {
      socket.off("order:new", handleRealTimeUpdate);
      socket.off("order:status_updated", handleRealTimeUpdate);
    };
  }, [socket, joinAdminRoom, fetchDashboardData]);

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
                  onOrderUpdated={fetchDashboardData}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Spacer */}
        <div className="h-8 shrink-0" />
      </div>

      {/* Pinned Bottom Nav with Home Tab Active */}
      <AdminBottomNav />
    </div>
  );
}

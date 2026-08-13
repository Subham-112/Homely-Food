"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Utensils,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import Header from "@/components/Header";
import AdminBottomNav from "@/components/AdminBottomNav";
import AdminOrderCard from "@/components/AdminOrderCard";
import { getOrders, Order } from "@/services/orderService";
import { useSocket } from "@/context/SocketContext";

type FilterKey = "all" | "pending" | "confirmed" | "preparing" | "delivered" | "cancelled";

const FILTERS: { label: string; value: FilterKey }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Preparing", value: "preparing" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

export default function AdminOrdersManagementPage() {
  const { socket, joinAdminRoom } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Socket Real-Time Listener
  useEffect(() => {
    joinAdminRoom();

    if (!socket) return;

    const handleNewOrder = (newOrder: any) => {
      console.log("📢 Real-Time Socket Event in Admin (new order):", newOrder);
      setNewOrderAlert(`🔔 NEW ORDER: #${newOrder.orderNumber} - ₹${newOrder.totalAmount}`);
      setOrders((prev) => [newOrder, ...prev.filter((o) => o._id !== newOrder._id)]);
    };

    const handleStatusUpdate = (updatedOrder: any) => {
      console.log("📢 Real-Time Socket Event in Admin (status update):", updatedOrder);
      setOrders((prev) =>
        prev.map((o) =>
          o._id === updatedOrder._id || o._id === updatedOrder.id
            ? { ...o, ...updatedOrder }
            : o
        )
      );
    };

    socket.on("order:new", handleNewOrder);
    socket.on("order:status_updated", handleStatusUpdate);

    return () => {
      socket.off("order:new", handleNewOrder);
      socket.off("order:status_updated", handleStatusUpdate);
    };
  }, [socket, joinAdminRoom]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch orders (only for initial load, filter change, search, or pagination)
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOrders({
        status: selectedStatus === "all" ? undefined : selectedStatus,
        orderType: selectedType === "all" ? undefined : selectedType,
        search: debouncedSearch || undefined,
        page,
        limit,
      });
      setOrders(res.orders);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, selectedType, debouncedSearch, page, limit]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Selective single order status update handler (NO API RE-FETCH, NO PAGE SPINNER)
  const handleSingleOrderUpdated = useCallback((updatedOrder?: any) => {
    if (updatedOrder && (updatedOrder._id || updatedOrder.id)) {
      setOrders((prev) =>
        prev.map((o) =>
          o._id === updatedOrder._id || o._id === updatedOrder.id
            ? { ...o, ...updatedOrder }
            : o
        )
      );
    }
  }, []);

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#F4F8FA] relative">
      {/* Header */}
      <Header />

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-5 max-w-5xl w-full mx-auto flex flex-col gap-4 pb-36">
        {/* Title & Real-Time Alert Banner */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B251C]">
                Orders
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Manage and track all incoming orders
              </p>
            </div>
            <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live Sockets Active
            </span>
          </div>

          {newOrderAlert && (
            <div className="bg-[#0B392B] text-white p-3.5 rounded-2xl shadow-lg border border-emerald-400/40 flex items-center justify-between animate-bounce">
              <span className="font-extrabold text-xs sm:text-sm">{newOrderAlert}</span>
              <button
                onClick={() => setNewOrderAlert(null)}
                className="text-xs font-bold bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg cursor-pointer ml-2"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by order ID, name, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#E1ECEE] rounded-xl py-2.5 pl-10 pr-9 text-xs text-[#0F261C] placeholder:text-gray-400 focus:outline-none focus:border-[#0B392B]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters (Order Type & Order Status) */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          {/* Order Type Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Order Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-[#E1ECEE] rounded-xl py-2 px-3 text-xs text-[#0F261C] font-bold focus:outline-none focus:border-[#0B392B] cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="dine-in">Normally (Dine-in)</option>
              <option value="delivery">Delivery</option>
              <option value="pickup">Pickup</option>
            </select>
          </div>

          {/* Order Status Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Order Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-[#E1ECEE] rounded-xl py-2 px-3 text-xs text-[#0F261C] font-bold focus:outline-none focus:border-[#0B392B] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center justify-between text-xs font-medium">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchOrders}
              className="text-red-700 underline font-bold hover:text-red-900 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#0B392B]" />
            <p className="text-xs font-medium">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center flex flex-col items-center gap-3 my-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#0B392B] flex items-center justify-center">
              <Utensils className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-800 text-sm">No orders found</h3>
            <p className="text-xs text-gray-500 max-w-xs">
              {debouncedSearch
                ? `No orders matching "${debouncedSearch}".`
                : selectedStatus !== "all" || selectedType !== "all"
                ? `No orders matching the selected filter criteria.`
                : "No orders have been placed yet."}
            </p>
          </div>
        ) : (
          <>
            {/* Order Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order) => (
                <AdminOrderCard
                  key={order._id}
                  order={order}
                  onOrderUpdated={handleSingleOrderUpdated}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 mt-2">
                <div className="text-xs text-gray-500 font-medium">
                  Showing{" "}
                  <span className="font-extrabold text-[#0B251C]">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-extrabold text-[#0B251C]">
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-extrabold text-[#0B251C]">
                    {pagination.total}
                  </span>{" "}
                  orders
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={!pagination.hasPrevPage || loading}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="p-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: pagination.totalPages },
                      (_, index) => index + 1
                    ).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-7 h-7 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          pageNum === pagination.page
                            ? "bg-[#0B392B] text-white shadow-xs"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={!pagination.hasNextPage || loading}
                    onClick={() => setPage((prev) => prev + 1)}
                    className="p-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Pinned Bottom Nav with Orders Tab Active */}
      <AdminBottomNav />
    </div>
  );
}

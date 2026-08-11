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
import {
  getOrders,
  updateOrderStatus,
  Order,
} from "@/services/orderService";

type FilterKey = "all" | "pending" | "confirmed" | "preparing" | "delivered" | "cancelled";

const FILTERS: { label: string; value: FilterKey }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Preparing", value: "preparing" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-[#FCE8E8] text-[#991B1B]",
  confirmed: "bg-[#F5EDD6] text-[#8C6B1B]",
  preparing: "bg-[#EBF5FC] text-[#1E40AF]",
  delivered: "bg-[#EAF5EE] text-[#00875A]",
  cancelled: "bg-gray-100 text-gray-500",
};

const NEXT_STATUS: Record<string, { label: string; value: string } | null> = {
  pending: { label: "Accept", value: "confirmed" },
  confirmed: { label: "Start Preparing", value: "preparing" },
  preparing: { label: "Mark Delivered", value: "delivered" },
  delivered: null,
  cancelled: null,
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

export default function AdminOrdersManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOrders({
        status: selectedFilter === "all" ? undefined : selectedFilter,
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
  }, [selectedFilter, debouncedSearch, page, limit]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle filter change
  const handleFilterChange = (filter: FilterKey) => {
    setSelectedFilter(filter);
    setPage(1);
  };

  // Handle status update
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o))
      );
    } catch (err: any) {
      console.error("Failed to update order status:", err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F4F8FA] relative">
      {/* Header */}
      <Header />

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-5 max-w-5xl w-full mx-auto flex flex-col gap-4 pb-36">
        {/* Title */}
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B251C]">
            Orders
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            Manage and track all incoming orders
          </p>
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

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 shrink-0">
          {FILTERS.map((filter) => {
            const isSelected = selectedFilter === filter.value;
            return (
              <button
                key={filter.value}
                onClick={() => handleFilterChange(filter.value)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? "bg-[#0B392B] text-white shadow-xs"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-[#0B392B]"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
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
                : selectedFilter !== "all"
                ? `No ${selectedFilter} orders at the moment.`
                : "No orders have been placed yet."}
            </p>
          </div>
        ) : (
          <>
            {/* Order Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order) => {
                const nextAction = NEXT_STATUS[order.status];
                const isUpdating = updatingOrderId === order._id;

                return (
                  <div
                    key={order._id}
                    className="bg-white rounded-2xl p-4 border border-gray-100/90 shadow-2xs flex flex-col justify-between gap-3"
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-base text-[#0B251C]">
                          {order.orderNumber}
                        </h3>
                        <p className="text-xs font-semibold text-gray-600 truncate">
                          {order.guest.name}
                        </p>
                        {order.guest.phone && (
                          <p className="text-[11px] text-gray-400 font-mono">
                            {order.guest.phone}
                          </p>
                        )}
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide shrink-0 ${
                          STATUS_STYLES[order.status] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    {/* Order Meta Info */}
                    <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                      <span className="flex items-center gap-1">
                        🕐 {formatDate(order.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Utensils className="w-3.5 h-3.5" />{" "}
                        {order.items.reduce((sum, i) => sum + i.quantity, 0)} Items
                      </span>
                    </div>

                    {/* Items Summary */}
                    <p className="text-xs text-gray-500 font-medium leading-relaxed truncate">
                      {order.items
                        .map((i) => `${i.quantity}x ${i.name}`)
                        .join(", ")}
                    </p>

                    {/* Price */}
                    <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                      <span className="font-extrabold text-lg text-[#0B251C]">
                        ₹{order.totalAmount}
                      </span>
                      {order.payment && (
                        <span className="text-[10px] font-semibold text-gray-400 uppercase">
                          {order.payment.method} · {order.payment.status}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                      {nextAction ? (
                        <>
                          <button className="flex-1 border border-[#0B392B] text-[#0B392B] font-bold text-xs py-2 rounded-xl hover:bg-[#0B392B]/5 transition-colors cursor-pointer">
                            Details
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateStatus(order._id, nextAction.value)
                            }
                            disabled={isUpdating}
                            className="flex-1 bg-[#0B392B] text-white font-bold text-xs py-2 rounded-xl hover:bg-[#07281E] transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            {isUpdating && (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            )}
                            {nextAction.label}
                          </button>
                        </>
                      ) : (
                        <button className="w-full border border-gray-200 text-[#0B392B] font-bold text-xs py-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
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

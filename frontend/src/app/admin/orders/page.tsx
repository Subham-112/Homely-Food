"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Utensils,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Filter,
  ChevronDown,
  Check,
  RotateCcw,
} from "lucide-react";
import Header from "@/components/Header";
import AdminBottomNav from "@/components/AdminBottomNav";
import GlobalOrderCard from "@/components/GlobalOrderCard";
import GlobalOrderDetailsModal from "@/components/GlobalOrderDetailsModal";
import GoToOrderModal from "@/components/GoToOrderModal";
import { getOrders, getOrderById, Order } from "@/services/orderService";
import { useSocket } from "@/context/SocketContext";

const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getYesterdayDateString = (): string => {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTomorrowDateString = (): string => {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const resolveDateParam = (param: string | null): string => {
  if (!param) return "";
  const lower = param.toLowerCase().trim();
  if (lower === "today") return getTodayDateString();
  if (lower === "yesterday") return getYesterdayDateString();
  return param;
};

const formatRelativeDateLabel = (dateStr: string): string => {
  if (!dateStr) return "All Dates";

  if (dateStr.toLowerCase() === "today") return "Today";
  if (dateStr.toLowerCase() === "yesterday") return "Yesterday";

  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return dateStr;

  const [year, month, day] = parts;
  const targetDate = new Date(year, month - 1, day);
  const now = new Date();
  const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const yesterday = new Date(todayZero);
  yesterday.setDate(yesterday.getDate() - 1);

  const tomorrow = new Date(todayZero);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (targetDate.getTime() === todayZero.getTime()) {
    return "Today";
  } else if (targetDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  } else if (targetDate.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  } else {
    const weekday = targetDate.toLocaleDateString("en-IN", { weekday: "short" });
    const dayMonth = targetDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    return `${weekday}, ${dayMonth}`;
  }
};

function AdminOrdersManagementContent() {
  const { socket, joinAdminRoom } = useSocket();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";
  const initialDate = resolveDateParam(searchParams.get("date"));

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);
  const [selectedOrderModal, setSelectedOrderModal] = useState<Order | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [isGoToOrderOpen, setIsGoToOrderOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync filter when URL search parameters change
  useEffect(() => {
    const statusFromUrl = searchParams.get("status") || "all";
    const dateFromUrl = resolveDateParam(searchParams.get("date"));
    setSelectedStatus(statusFromUrl);
    setSelectedDate(dateFromUrl);
    setPage(1);
  }, [searchParams]);
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

  // Dismiss in-app banner when the modal's Dismiss button is clicked
  useEffect(() => {
    const onModalDismissed = () => setNewOrderAlert(null);
    window.addEventListener("admin:order-alert-dismissed", onModalDismissed);
    return () => window.removeEventListener("admin:order-alert-dismissed", onModalDismissed);
  }, []);

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
        date: selectedDate || undefined,
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
  }, [selectedStatus, selectedType, selectedDate, debouncedSearch, page, limit]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Listen to header refresh button
  useEffect(() => {
    const onRefresh = () => {
      fetchOrders();
    };
    window.addEventListener("admin:refresh-data", onRefresh);
    return () => window.removeEventListener("admin:refresh-data", onRefresh);
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
      setSelectedOrderModal((prev) =>
        prev && (prev._id === updatedOrder._id || prev._id === updatedOrder.id)
          ? { ...prev, ...updatedOrder }
          : prev
      );
    }
  }, []);

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
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-5 pb-36 sm:pb-36 max-w-5xl w-full mx-auto flex flex-col gap-4">
        {/* Title & Real-Time Alert Banner */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B251C]">
                Orders
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Manage and track all incoming orders
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsGoToOrderOpen(true)}
                className="bg-[#0B392B] hover:bg-[#07281E] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Go to order</span>
              </button>
              <span className="hidden sm:flex text-[10px] font-extrabold px-3 py-2 rounded-full bg-emerald-100 text-emerald-800 items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live Sockets Active
              </span>
            </div>
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

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 flex items-center">
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

          {/* Filter Dropdown Button */}
          <div className="relative shrink-0" ref={filterRef}>
            <button
              type="button"
              onClick={() => setIsFilterOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 border px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                selectedDate || selectedType !== "all" || selectedStatus !== "all"
                  ? "bg-emerald-50 border-emerald-300 text-[#0B392B]"
                  : "bg-white border-[#E1ECEE] hover:border-[#0B392B]/40 text-[#0B251C]"
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-[#0B392B]" />
              <span className="hidden sm:inline">Filters</span>
              {(selectedDate || selectedType !== "all" || selectedStatus !== "all") && (
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isFilterOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Content-Fit Filter Dropdown Menu */}
            {isFilterOpen && (
              <div className="absolute right-0 top-full mt-2 w-max max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#0B392B]" />
                    <span className="text-xs font-extrabold text-[#0B251C] uppercase tracking-wider whitespace-nowrap">
                      Filter Orders
                    </span>
                  </div>
                  {(selectedDate || selectedType !== "all" || selectedStatus !== "all") && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate("");
                        setSelectedType("all");
                        setSelectedStatus("all");
                        setPage(1);
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg cursor-pointer transition-colors whitespace-nowrap"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset All</span>
                    </button>
                  )}
                </div>

                {/* Filter Form Controls (Column-wise / Stacked content) */}
                <div className="flex flex-col gap-3.5 py-3.5 min-w-[260px] sm:min-w-[300px]">
                  {/* Date Filter */}
                  <div className="flex flex-col gap-1.5">
                    {/* Header with quick Today & Tomorrow buttons */}
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#0B392B]" /> Date
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDate(getTodayDateString());
                            setPage(1);
                          }}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                            selectedDate === getTodayDateString()
                              ? "bg-[#0B392B] text-white border-[#0B392B]"
                              : "bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDate(getTomorrowDateString());
                            setPage(1);
                          }}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                            selectedDate === getTomorrowDateString()
                              ? "bg-[#0B392B] text-white border-[#0B392B]"
                              : "bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          Tomorrow
                        </button>
                      </div>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setPage(1);
                        }}
                        className="w-full bg-[#FAF6ED] border border-[#E1ECEE] rounded-xl py-2 px-2.5 text-xs text-[#0F261C] font-bold focus:outline-none focus:border-[#0B392B] cursor-pointer"
                      />
                      {selectedDate && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDate("");
                            setPage(1);
                          }}
                          title="Clear Date"
                          className="absolute right-7 text-gray-400 hover:text-red-600 p-0.5 cursor-pointer bg-[#FAF6ED] rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Type Filter */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Type
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => {
                        setSelectedType(e.target.value);
                        setPage(1);
                      }}
                      className="w-full bg-white border border-[#E1ECEE] rounded-xl py-2 px-3 text-xs text-[#0F261C] font-bold focus:outline-none focus:border-[#0B392B] cursor-pointer"
                    >
                      <option value="all">All Types</option>
                      <option value="dine-in">Normally (Dine-in)</option>
                      <option value="delivery">Delivery</option>
                      <option value="pickup">Pickup</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => {
                        setSelectedStatus(e.target.value);
                        setPage(1);
                      }}
                      className="w-full bg-white border border-[#E1ECEE] rounded-xl py-2 px-3 text-xs text-[#0F261C] font-bold focus:outline-none focus:border-[#0B392B] cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="delivered">Delivered</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(false)}
                    className="bg-[#0B392B] hover:bg-[#07281E] text-white text-xs font-extrabold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Applied Filters Container (Horizontal Scroll with sticky Clear All) */}
        {(selectedDate || selectedType !== "all" || selectedStatus !== "all") && (
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[#E1ECEE] shadow-xs">
            {/* Scrollable Chips Area */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
              <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider whitespace-nowrap shrink-0">
                Applied:
              </span>

              {/* Date Chip */}
              {selectedDate && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-[#0B392B] border border-emerald-200/80 rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap shrink-0 shadow-3xs animate-in fade-in">
                  <Calendar className="w-3.5 h-3.5 text-[#0B392B] shrink-0" />
                  <span>{formatRelativeDateLabel(selectedDate)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate("");
                      setPage(1);
                    }}
                    title="Remove Date filter"
                    className="hover:bg-emerald-200/70 p-0.5 rounded-md text-[#0B392B] transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* Type Chip */}
              {selectedType !== "all" && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-[#0B392B] border border-emerald-200/80 rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap shrink-0 shadow-3xs animate-in fade-in">
                  <span className="capitalize">{selectedType === "dine-in" ? "Normally" : selectedType}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedType("all");
                      setPage(1);
                    }}
                    title="Remove Type filter"
                    className="hover:bg-emerald-200/70 p-0.5 rounded-md text-[#0B392B] transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* Status Chip */}
              {selectedStatus !== "all" && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-[#0B392B] border border-emerald-200/80 rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap shrink-0 shadow-3xs animate-in fade-in">
                  <span className="capitalize">{selectedStatus}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStatus("all");
                      setPage(1);
                    }}
                    title="Remove Status filter"
                    className="hover:bg-emerald-200/70 p-0.5 rounded-md text-[#0B392B] transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            {/* Sticky Reset All X Button at the Rightmost End */}
            <div className="shrink-0 pl-2 border-l border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setSelectedDate("");
                  setSelectedType("all");
                  setSelectedStatus("all");
                  setPage(1);
                }}
                title="Reset all filters"
                className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-xs transition-all duration-150 cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

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
                : selectedDate
                ? `No orders found for ${formatRelativeDateLabel(selectedDate)} (${selectedDate}).`
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
                <GlobalOrderCard
                  key={order._id}
                  order={order}
                  variant="admin"
                  onOrderUpdated={handleSingleOrderUpdated}
                  onCardClick={(ord) => handleOpenOrderModal(ord._id)}
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

      {/* Order Details Modal (API Fetched) */}
      {modalLoading && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#0B392B]" />
            <p className="text-xs font-bold text-[#0B251C]">Fetching order details from API...</p>
          </div>
        </div>
      )}

      {selectedOrderModal && !modalLoading && (
        <GlobalOrderDetailsModal
          order={selectedOrderModal}
          variant="admin"
          onClose={() => setSelectedOrderModal(null)}
        />
      )}

      {/* Quick Go to Order Lookup Modal */}
      <GoToOrderModal
        isOpen={isGoToOrderOpen}
        onClose={() => setIsGoToOrderOpen(false)}
        onOrderFound={(foundOrder) => {
          setSelectedOrderModal(foundOrder);
        }}
      />

      {/* Pinned Bottom Nav with Orders Tab Active */}
      <AdminBottomNav />
    </div>
  );
}

export default function AdminOrdersManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col h-dvh bg-[#F4F8FA] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0B392B]" />
        </div>
      }
    >
      <AdminOrdersManagementContent />
    </Suspense>
  );
}

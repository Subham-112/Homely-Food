"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Button from "@/components/Button";
import GlobalOrderCard from "@/components/GlobalOrderCard";
import GlobalOrderDetailsModal from "@/components/GlobalOrderDetailsModal";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { getMyOrders, Order } from "@/services/orderService";
import { useSocket } from "@/context/SocketContext";

type FilterType = "All" | "Preparing" | "Ready" | "Completed";

export default function OrdersPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { reorderCart } = useCart();
  const { socket } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<FilterType>("All");

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  // Selected Order for Details Modal
  const [selectedOrderModal, setSelectedOrderModal] = useState<Order | null>(null);

  // Real-time socket status update listener on customer orders page
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (updatedOrder: any) => {
      console.log("📢 Real-Time Socket Event in User Orders List:", updatedOrder);
      const targetId = updatedOrder._id || updatedOrder.orderNumber;
      setOrders((prev) => {
        if (!Array.isArray(prev)) return [];
        return prev.map((o) =>
          o._id === targetId || o.orderNumber === targetId || o._id === updatedOrder._id
            ? { ...o, ...updatedOrder }
            : o
        );
      });

      // If modal is currently open for this order, update modal state too
      setSelectedOrderModal((prevModal) => {
        if (
          prevModal &&
          (prevModal._id === targetId ||
            prevModal.orderNumber === targetId ||
            prevModal._id === updatedOrder._id)
        ) {
          return { ...prevModal, ...updatedOrder };
        }
        return prevModal;
      });
    };

    socket.on("order:status_updated", handleStatusUpdate);

    return () => {
      socket.off("order:status_updated", handleStatusUpdate);
    };
  }, [socket]);

  const fetchUserOrders = useCallback(async (currentFilter: FilterType) => {
    setLoading(true);
    setPage(1);
    try {
      if (token) {
        const queryStatus = currentFilter === "All" ? undefined : currentFilter.toLowerCase();
        const resOrders = await getMyOrders({ status: queryStatus, page: 1, limit: 20 });
        const orderList = Array.isArray(resOrders)
          ? resOrders
          : Array.isArray(resOrders?.orders)
          ? resOrders.orders
          : [];
        setOrders(orderList);
        setHasMore(resOrders?.pagination ? resOrders.pagination.page < resOrders.pagination.totalPages : false);
        setTotalCount(resOrders?.pagination?.total ?? orderList.length);
      } else {
        setOrders([]);
        setHasMore(false);
        setTotalCount(0);
      }
    } catch (err) {
      console.error("Failed to fetch user orders via getMyOrders:", err);
      setOrders([]);
      setHasMore(false);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load next page on scroll
  const loadNextPage = useCallback(async () => {
    if (loadingMore || !hasMore || loading || !token) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const queryStatus = filter === "All" ? undefined : filter.toLowerCase();
      const resOrders = await getMyOrders({ status: queryStatus, page: nextPage, limit: 20 });
      const newOrders = Array.isArray(resOrders)
        ? resOrders
        : Array.isArray(resOrders?.orders)
        ? resOrders.orders
        : [];

      setOrders((prev) => {
        const existingIds = new Set(prev.map((o) => o._id || o.orderNumber));
        const uniqueNewOrders = newOrders.filter((o) => !existingIds.has(o._id || o.orderNumber));
        return [...prev, ...uniqueNewOrders];
      });

      setPage(nextPage);
      setHasMore(resOrders?.pagination ? resOrders.pagination.page < resOrders.pagination.totalPages : false);
      setTotalCount(resOrders?.pagination?.total ?? totalCount);
    } catch (err) {
      console.error("Failed to load next page of orders:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore, loading, token, filter, totalCount]);

  useEffect(() => {
    fetchUserOrders(filter);
  }, [filter, fetchUserOrders]);

  // Sentinel IntersectionObserver for smooth infinite scrolling
  useEffect(() => {
    if (!hasMore || loadingMore || loading) return;

    const sentinel = sentinelRef.current;
    const root = scrollContainerRef.current;
    if (!sentinel || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          loadNextPage();
        }
      },
      {
        root,
        rootMargin: "250px",
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadNextPage]);

  // Fallback onScroll handler
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 250) {
      if (hasMore && !loadingMore && !loading) {
        loadNextPage();
      }
    }
  };

  const orderList = Array.isArray(orders) ? orders : [];
  const filteredOrders = orderList.filter((order) => {
    const statusLower = (order?.status || "").toLowerCase();

    if (filter === "Preparing") {
      return (
        statusLower === "preparing" ||
        statusLower === "accepted" ||
        statusLower === "pending"
      );
    }
    if (filter === "Ready") {
      return statusLower === "ready";
    }
    if (filter === "Completed") {
      return (
        statusLower === "completed" ||
        statusLower === "delivered" ||
        statusLower === "cancelled"
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#FAF6ED] relative">
      {/* Fixed Top Header */}
      <Header />

      {/* Middle Scrollable Content */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-5 max-w-4xl w-full mx-auto flex flex-col gap-4 pb-24"
      >
        <div className="flex items-center justify-between px-0.5">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B251C] font-poppins">
            My Orders
          </h1>
          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#0B392B]/10 text-[#0B392B]">
            {totalCount || filteredOrders.length} {totalCount === 1 || filteredOrders.length === 1 ? "Order" : "Orders"}
          </span>
        </div>

        {/* Status Filter Pills: All, Preparing, Ready, Completed */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 shrink-0">
          {(["All", "Preparing", "Ready", "Completed"] as const).map((tab) => {
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
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {filteredOrders.map((order) => (
                <GlobalOrderCard
                  key={order._id}
                  order={order}
                  variant="user"
                  onCardClick={(ord) => setSelectedOrderModal(ord)}
                  onTrackOrder={(ord) =>
                    router.push(`/order-tracking?orderId=${ord.orderNumber || ord._id}`)
                  }
                  onReorder={async (ord) => {
                    await reorderCart(ord._id);
                    router.push("/cart");
                  }}
                />
              ))}
            </div>

            {/* Sentinel element to trigger infinite scroll as user nears end of list */}
            <div ref={sentinelRef} className="h-2 w-full -mt-1 pointer-events-none" />

            {/* Loading More Indicator */}
            {loadingMore && (
              <div className="py-3 flex items-center justify-center gap-2 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin text-[#0B392B]" />
                <span className="text-xs font-semibold">Loading more orders...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global Order Details Modal */}
      <GlobalOrderDetailsModal
        order={selectedOrderModal}
        variant="user"
        onClose={() => setSelectedOrderModal(null)}
      />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

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

type FilterType = "All" | "Active" | "Ready" | "Completed";

export default function OrdersPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { reorderCart } = useCart();
  const { socket } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("All");

  // Selected Order for Details Modal
  const [selectedOrderModal, setSelectedOrderModal] = useState<Order | null>(null);

  // Real-time socket status update listener on customer orders page
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (updatedOrder: any) => {
      console.log("📢 Real-Time Socket Event in User Orders List:", updatedOrder);
      const targetId = updatedOrder._id || updatedOrder.orderNumber;
      setOrders((prev) =>
        prev.map((o) =>
          o._id === targetId || o.orderNumber === targetId || o._id === updatedOrder._id
            ? { ...o, ...updatedOrder }
            : o
        )
      );

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
    try {
      if (token) {
        const resOrders = await getMyOrders(currentFilter);
        setOrders(resOrders || []);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Failed to fetch user orders via getMyOrders:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUserOrders(filter);
  }, [filter, fetchUserOrders]);

  const filteredOrders = orders.filter((order) => {
    const statusLower = (order.status || "").toLowerCase();

    if (filter === "Active") {
      return (
        statusLower === "pending" ||
        statusLower === "accepted" ||
        statusLower === "preparing"
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
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-5 max-w-4xl w-full mx-auto flex flex-col gap-4 pb-24">
        <div className="flex items-center justify-between px-0.5">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B251C] font-poppins">
            My Orders
          </h1>
          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#0B392B]/10 text-[#0B392B]">
            {orders.length} {orders.length === 1 ? "Order" : "Orders"}
          </span>
        </div>

        {/* Status Filter Pills: All, Active, Ready, Completed */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 shrink-0">
          {(["All", "Active", "Ready", "Completed"] as const).map((tab) => {
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

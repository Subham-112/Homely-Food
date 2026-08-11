"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle2, CookingPot, ChevronRight, RotateCcw, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import VegBadge from "@/components/VegBadge";
import Button from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { getOrders } from "@/services/orderService";
import { formatUTCToIST } from "@/utils/datetime";

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  date: string;
  time: string;
  status: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  orderType: string;
  deliveryAddress?: string;
  pickupTiming?: string;
}

const decodeToken = (token: string) => {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch (err) {
    return null;
  }
};

export default function OrdersPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"All" | "Active" | "Completed">("All");

  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const decoded = decodeToken(token);
        const userId = decoded?._id;
        if (userId) {
          const res = await getOrders({ userId });
          const formattedOrders: Order[] = res.orders.map((ord: any) => ({
            id: ord.orderNumber,
            date: new Date(ord.createdAt).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" }),
            time: new Date(ord.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: ord.status,
            items: ord.items.map((item: any) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
            totalAmount: ord.totalAmount,
            paymentMethod: ord.payment?.method || "Cash",
            orderType: ord.orderType,
            deliveryAddress: ord.deliveryAddress,
            pickupTiming: ord.pickupTiming,
          }));
          setOrders(formattedOrders);
        }
      } catch (err) {
        console.error("Failed to fetch user orders:", err);
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
    if (filter === "Completed") return order.status.toLowerCase() === "completed" || order.status.toLowerCase() === "delivered";
    return true;
  });

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#FAF6ED] relative">
      {/* Fixed Top Header */}
      <Header />

      {/* Middle Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-5 max-w-4xl w-full mx-auto flex flex-col gap-4 pb-20">
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B251C] font-poppins">
          My Orders
        </h1>

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
            <span className="text-xs font-semibold">Loading your orders...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 flex flex-col items-center justify-center gap-4 shadow-sm">
            <Clock className="w-12 h-12 text-gray-400" />
            <p className="text-gray-500 font-medium text-base">No orders found.</p>
            <Link href="/">
              <Button variant="primary" fullWidth={false}>
                Explore Menu
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {filteredOrders.map((order) => {
              const statusLower = order.status.toLowerCase();
              const isActiveOrder =
                statusLower === "pending" ||
                statusLower === "accepted" ||
                statusLower === "preparing" ||
                statusLower === "ready";

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs flex flex-col justify-between gap-4"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm sm:text-base text-[#0B251C]">
                          {order.id}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">
                          {order.orderType === "dine-in" ? "normally" : order.orderType}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {order.date} • {order.time}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div
                      className={`px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                        isActiveOrder
                          ? "bg-[#EBF5FC] text-[#0B392B] border border-[#D4E8F8]"
                          : "bg-[#EAF5EE] text-[#00875A] border border-[#D5EBDC]"
                      }`}
                    >
                      {isActiveOrder ? (
                        <CookingPot className="w-3.5 h-3.5 animate-pulse" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span className="capitalize">{order.status}</span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="flex flex-col gap-2.5 flex-1">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs sm:text-sm text-gray-800"
                      >
                        <div className="flex items-center gap-2">
                          <VegBadge size={14} />
                          <span className="font-medium">
                            {item.name} x {item.quantity}
                          </span>
                        </div>
                        <span className="font-bold text-[#0B251C]">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Conditional Delivery / Pickup Info */}
                  {order.orderType === "delivery" && order.deliveryAddress && (
                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs text-gray-600 leading-relaxed">
                      <span className="font-bold block text-gray-700 mb-0.5">Delivery Address:</span>
                      {order.deliveryAddress}
                    </div>
                  )}

                  {order.orderType === "pickup" && order.pickupTiming && (
                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs text-gray-600">
                      <span className="font-bold block text-gray-700 mb-0.5">Pickup Timing:</span>
                      {formatUTCToIST(order.pickupTiming)}
                    </div>
                  )}

                  {/* Card Footer */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3.5 mt-1">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Total Amount
                      </span>
                      <span className="text-base sm:text-lg font-extrabold text-[#0B251C]">
                        ₹{order.totalAmount}
                      </span>
                    </div>

                    {isActiveOrder ? (
                      <Link href="/order-tracking">
                        <button className="bg-[#0B392B] hover:bg-[#07281E] text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-1 transition-colors cursor-pointer">
                          Track Order <ChevronRight className="w-4 h-4" />
                        </button>
                      </Link>
                    ) : (
                      <button
                        onClick={() => router.push("/cart")}
                        className="border border-[#0B392B] text-[#0B392B] hover:bg-[#0B392B] hover:text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reorder
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

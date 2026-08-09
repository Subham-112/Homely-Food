"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle2, CookingPot, ChevronRight, RotateCcw } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import VegBadge from "@/components/VegBadge";
import Button from "@/components/Button";
import { useCart, Order } from "@/context/CartContext";

export default function OrdersPage() {
  const router = useRouter();
  const { orders } = useCart();
  const [filter, setFilter] = useState<"All" | "Active" | "Completed">("All");

  const filteredOrders = orders.filter((order) => {
    if (filter === "Active") return order.status === "Accepted" || order.status === "Preparing" || order.status === "Ready";
    if (filter === "Completed") return order.status === "Completed";
    return true;
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#FAF6ED] relative">
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
        {filteredOrders.length === 0 ? (
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
              const isActiveOrder =
                order.status === "Accepted" ||
                order.status === "Preparing" ||
                order.status === "Ready";

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs flex flex-col justify-between gap-4"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <span className="font-extrabold text-sm sm:text-base text-[#0B251C]">
                        {order.id}
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
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
                        <CookingPot className="w-3.5 h-3.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>{order.status}</span>
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

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
    <div className="flex flex-col h-full overflow-hidden bg-[#FAF6ED] relative">
      {/* Pinned Top Header */}
      <Header />

      {/* Middle Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 pb-20">
        <h1 className="text-xl font-bold text-[#0B251C] font-poppins">
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
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
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
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 flex flex-col items-center justify-center gap-3">
            <Clock className="w-10 h-10 text-gray-400" />
            <p className="text-gray-500 font-medium">No orders found.</p>
            <Link href="/">
              <Button variant="primary" fullWidth={false}>
                Explore Menu
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredOrders.map((order) => {
              const isActiveOrder =
                order.status === "Accepted" ||
                order.status === "Preparing" ||
                order.status === "Ready";

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex flex-col gap-3"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <span className="font-extrabold text-sm text-[#0B251C]">
                        {order.id}
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {order.date} • {order.time}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
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
                  <div className="flex flex-col gap-2">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs text-gray-800"
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
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-1">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Total Amount
                      </span>
                      <span className="text-sm font-extrabold text-[#0B251C]">
                        ₹{order.totalAmount}
                      </span>
                    </div>

                    {isActiveOrder ? (
                      <Link href="/order-tracking">
                        <button className="bg-[#0B392B] hover:bg-[#07281E] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 transition-colors cursor-pointer">
                          Track Order <ChevronRight className="w-4 h-4" />
                        </button>
                      </Link>
                    ) : (
                      <button
                        onClick={() => router.push("/cart")}
                        className="border border-[#0B392B] text-[#0B392B] hover:bg-[#0B392B] hover:text-white text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
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

      {/* Pinned Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

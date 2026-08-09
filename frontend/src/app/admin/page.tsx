"use client";

import React from "react";
import Link from "next/link";
import { FileText, Clock, CookingPot, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import AdminBottomNav from "@/components/AdminBottomNav";

export default function AdminHomePage() {
  const recentOrders = [
    {
      id: "#ORD-092",
      customer: "Rahul Sharma",
      status: "PENDING",
      statusStyle: "bg-[#FCE8E8] text-[#991B1B]",
      items: "2x Paneer Butter Masala, 4x Butter Naan, 1x Jeera Rice",
      price: 640,
    },
    {
      id: "#ORD-091",
      customer: "Priya Patel",
      status: "PREPARING",
      statusStyle: "bg-[#F5EDD6] text-[#8C6B1B]",
      items: "1x South Indian Thali",
      price: 220,
    },
    {
      id: "#ORD-090",
      customer: "Amit Kumar",
      status: "READY",
      statusStyle: "bg-[#E2EFF7] text-[#1E40AF]",
      items: "3x Veg Biryani, 1x Raita",
      price: 750,
    },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F4F8FA] relative">
      {/* Header */}
      <Header />

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-5 max-w-5xl w-full mx-auto flex flex-col gap-5 pb-20">
        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B251C] font-poppins">
          Overview
        </h1>

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Card 1: Today's Orders */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                TODAY'S ORDERS
              </span>
              <span className="text-2xl font-extrabold text-[#0B251C] mt-0.5 block">
                142
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
                12
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
              <span className="text-2xl font-extrabold text-[#0B392B] mt-0.5 block">
                8
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#F7EFE0] text-[#8C6B1B] flex items-center justify-center shrink-0">
              <CookingPot className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Recent Orders Section */}
        <div className="flex flex-col gap-3 mt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0B251C]">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-[#0B392B] hover:underline flex items-center gap-0.5"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex flex-col justify-between gap-3"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-[#0B251C]">
                      {order.id}
                    </h3>
                    <p className="text-xs font-semibold text-gray-600">
                      {order.customer}
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide ${order.statusStyle}`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* Items Summary */}
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  {order.items}
                </p>

                {/* Price & Update Button */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-2.5 mt-0.5">
                  <span className="font-extrabold text-lg text-[#0B251C]">
                    ₹ {order.price}
                  </span>
                  <Link href="/admin/orders">
                    <button className="bg-[#0B392B] hover:bg-[#07281E] text-white text-xs font-bold px-5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer">
                      Update
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pinned Bottom Nav with Home Tab Active */}
      <AdminBottomNav />
    </div>
  );
}

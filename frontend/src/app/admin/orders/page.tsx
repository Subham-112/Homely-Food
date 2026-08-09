"use client";

import React, { useState } from "react";
import { Search, Utensils } from "lucide-react";
import Header from "@/components/Header";
import AdminBottomNav from "@/components/AdminBottomNav";

export default function AdminOrdersManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  const [orders, setOrders] = useState([
    {
      id: "#ORD-092",
      customer: "Rahul Sharma",
      time: "Today, 12:45 PM",
      itemCount: 3,
      status: "Pending",
    },
    {
      id: "#ORD-091",
      customer: "Priya Patel",
      time: "Today, 12:15 PM",
      itemCount: 5,
      status: "Preparing",
    },
    {
      id: "#ORD-089",
      customer: "Amit Kumar",
      time: "Today, 11:30 AM",
      itemCount: 2,
      status: "Completed",
    },
  ]);

  const filters = ["All", "Pending", "Preparing", "Ready", "Completed"];

  const filteredOrders = orders.filter((order) => {
    const matchesFilter =
      selectedFilter === "All" || order.status === selectedFilter;
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleUpdateStatus = (id: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F4F8FA] relative">
      {/* Header */}
      <Header />

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-5 max-w-5xl w-full mx-auto flex flex-col gap-4 pb-20">
        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="w-5 h-5 absolute left-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Order ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#E1ECEE] rounded-xl py-3 pl-11 pr-4 text-xs text-[#0F261C] placeholder:text-gray-400 focus:outline-none focus:border-[#0B392B]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 shrink-0">
          {filters.map((filter) => {
            const isSelected = selectedFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#0B392B] text-white shadow-xs"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-[#0B392B]"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        {/* Order Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl p-4 border border-gray-100/90 shadow-2xs flex flex-col justify-between gap-3"
            >
              {/* Header row */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-[#0B251C]">
                    {order.id}
                  </h3>
                  <p className="text-xs font-semibold text-gray-600">
                    {order.customer}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    order.status === "Pending"
                      ? "bg-[#F5EDD6] text-[#8C6B1B]"
                      : order.status === "Preparing"
                      ? "bg-[#EBF5FC] text-[#0B392B]"
                      : order.status === "Ready"
                      ? "bg-[#EAF5EE] text-[#00875A]"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {order.status}
                </span>
              </div>

              {/* Order Meta Info */}
              <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                <span className="flex items-center gap-1">
                  🕐 {order.time}
                </span>
                <span className="flex items-center gap-1">
                  <Utensils className="w-3.5 h-3.5" /> {order.itemCount} Items
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                {order.status === "Pending" && (
                  <>
                    <button className="flex-1 border border-[#0B392B] text-[#0B392B] font-bold text-xs py-2 rounded-xl hover:bg-[#0B392B]/5 transition-colors cursor-pointer">
                      Details
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(order.id, "Preparing")}
                      className="flex-1 bg-[#0B392B] text-white font-bold text-xs py-2 rounded-xl hover:bg-[#07281E] transition-colors cursor-pointer"
                    >
                      Accept
                    </button>
                  </>
                )}

                {order.status === "Preparing" && (
                  <>
                    <button className="flex-1 border border-[#0B392B] text-[#0B392B] font-bold text-xs py-2 rounded-xl hover:bg-[#0B392B]/5 transition-colors cursor-pointer">
                      Details
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(order.id, "Ready")}
                      className="flex-1 bg-[#0B392B] text-white font-bold text-xs py-2 rounded-xl hover:bg-[#07281E] transition-colors cursor-pointer"
                    >
                      Mark Ready
                    </button>
                  </>
                )}

                {(order.status === "Completed" || order.status === "Ready") && (
                  <button className="w-full border border-gray-200 text-[#0B392B] font-bold text-xs py-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                    View Details
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pinned Bottom Nav with Orders Tab Active */}
      <AdminBottomNav />
    </div>
  );
}

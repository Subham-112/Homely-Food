"use client";

import React, { useState } from "react";
import { Search, Download } from "lucide-react";
import Header from "@/components/Header";
import AdminBottomNav from "@/components/AdminBottomNav";

interface Customer {
  id: string;
  name: string;
  phone: string;
  type: "Registered" | "Guest";
  totalOrders: number;
  totalSpent: string;
  avatarBg: string;
  avatarText: string;
}

export default function AdminCustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const customers: Customer[] = [
    {
      id: "1",
      name: "John Doe",
      phone: "+1 (555) 123-4567",
      type: "Registered",
      totalOrders: 24,
      totalSpent: "$450.00",
      avatarBg: "bg-[#0B392B]",
      avatarText: "text-white",
    },
    {
      id: "2",
      name: "Alice Smith",
      phone: "+1 (555) 987-6543",
      type: "Guest",
      totalOrders: 2,
      totalSpent: "$35.50",
      avatarBg: "bg-[#D8EDFC]",
      avatarText: "text-[#0B392B]",
    },
    {
      id: "3",
      name: "Rajesh Joshi",
      phone: "+1 (555) 456-7890",
      type: "Registered",
      totalOrders: 15,
      totalSpent: "$280.00",
      avatarBg: "bg-[#0B392B]",
      avatarText: "text-white",
    },
  ];

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#FAF6ED] relative">
      {/* Header */}
      <Header />

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 pb-20">
        {/* Title Row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#0B251C] font-poppins">
              Customers
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Manage and view your customer base.
            </p>
          </div>

          <button className="border-2 border-[#0B392B] text-[#0B392B] hover:bg-[#0B392B]/5 font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="w-5 h-5 absolute left-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search customers by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#E8F0F2] rounded-xl py-3 pl-11 pr-4 text-xs text-[#0F261C] placeholder:text-gray-400 focus:outline-none focus:border-[#0B392B]"
          />
        </div>

        {/* Customer Cards List */}
        <div className="flex flex-col gap-3.5">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex flex-col gap-3"
            >
              {/* Profile Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-full ${customer.avatarBg} ${customer.avatarText} flex items-center justify-center font-bold text-sm shrink-0`}
                  >
                    {getInitials(customer.name)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[#0B251C]">
                      {customer.name}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      {customer.phone}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-3 py-0.5 rounded-md text-[11px] font-bold ${
                    customer.type === "Registered"
                      ? "bg-[#E6E4D5] text-[#595536]"
                      : "bg-[#DDEBF5] text-[#2C4D66]"
                  }`}
                >
                  {customer.type}
                </span>
              </div>

              <div className="h-[1px] bg-gray-100 w-full" />

              {/* Stats Grid */}
              <div className="grid grid-cols-2 text-center divide-x divide-gray-100">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">
                    Total Orders
                  </span>
                  <span className="font-extrabold text-base text-[#0B251C]">
                    {customer.totalOrders}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">
                    Total Spent
                  </span>
                  <span className="font-extrabold text-base text-[#0B251C]">
                    {customer.totalSpent}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pinned Bottom Navigation */}
      <AdminBottomNav />
    </div>
  );
}

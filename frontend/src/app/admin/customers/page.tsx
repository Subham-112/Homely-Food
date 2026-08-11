"use client";

import React, { useState, useEffect } from "react";
import { Search, Download, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import AdminBottomNav from "@/components/AdminBottomNav";
import { getCustomers, CustomerProfile } from "@/services/customerService";

export default function AdminCustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const data = await getCustomers();
        setCustomers(data);
      } catch (err: any) {
        console.error("Error fetching customers:", err);
        setError("Failed to load customers. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.primaryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const getInitials = (name: string) => {
    if (!name) return "G";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#FAF6ED] relative">
      {/* Header */}
      <Header />

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-5 max-w-5xl w-full mx-auto flex flex-col gap-4 pb-20">
        {/* Title Row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B251C] font-poppins">
              Customers
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Manage and view your customer base.
            </p>
          </div>

          <button className="border-2 border-[#0B392B] text-[#0B392B] hover:bg-[#0B392B]/5 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer">
            <Download className="w-4 h-4" /> Export
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

        {/* Customer Cards Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#0B392B]" />
            <p className="text-xs text-gray-500 font-bold">Loading customers...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 text-xs font-bold text-center p-6 rounded-2xl border border-red-100 my-4">
            {error}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="bg-white text-center py-16 px-4 rounded-2xl border border-gray-100 flex flex-col items-center gap-2">
            <p className="text-sm font-bold text-gray-800">No customers found</p>
            <p className="text-xs text-gray-400">Try matching names or phone numbers.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((customer) => {
              const isRegistered = customer.customerType === "registered";
              const avatarBg = isRegistered ? "bg-[#0B392B]" : "bg-[#D8EDFC]";
              const avatarText = isRegistered ? "text-white" : "text-[#0B392B]";
              const displayType = isRegistered ? "Registered" : "Guest";

              return (
                <div
                  key={customer._id}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex flex-col justify-between gap-3"
                >
                  {/* Profile Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-full ${avatarBg} ${avatarText} flex items-center justify-center font-bold text-sm shrink-0`}
                      >
                        {getInitials(customer.primaryName)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-[#0B251C]">
                          {customer.primaryName}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium">
                          {customer.phone}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-0.5 rounded-md text-[11px] font-bold ${
                        isRegistered
                          ? "bg-[#E6E4D5] text-[#595536]"
                          : "bg-[#DDEBF5] text-[#2C4D66]"
                      }`}
                    >
                      {displayType}
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
                        {customer.orderCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">
                        Total Spent
                      </span>
                      <span className="font-extrabold text-base text-[#0B251C]">
                        ₹{customer.totalExpenses.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pinned Bottom Navigation */}
      <AdminBottomNav />
    </div>
  );
}

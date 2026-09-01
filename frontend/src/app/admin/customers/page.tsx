"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, X, ShoppingBag } from "lucide-react";
import Header from "@/components/Header";
import AdminBottomNav from "@/components/AdminBottomNav";
import GlobalOrderCard from "@/components/GlobalOrderCard";
import GlobalOrderDetailsModal from "@/components/GlobalOrderDetailsModal";
import { getCustomers, CustomerProfile } from "@/services/customerService";
import { getOrders, Order } from "@/services/orderService";

export default function AdminCustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected customer state for orders modal
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingCustomerOrders, setLoadingCustomerOrders] = useState(false);
  const [loadingMoreCustomerOrders, setLoadingMoreCustomerOrders] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [hasMoreOrders, setHasMoreOrders] = useState(false);

  // Selected order state for order details modal
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

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

  const fetchOrdersForCustomer = async (customer: CustomerProfile, pageNum: number, append: boolean = false) => {
    if (append) {
      setLoadingMoreCustomerOrders(true);
    } else {
      setLoadingCustomerOrders(true);
    }

    try {
      // Pass customer.phone in userPhone query parameter to search across User, Customer, and Guest models in backend
      const res = await getOrders({ userPhone: customer.phone, limit: 20, page: pageNum });

      const fetchedList = res.orders || [];
      const hasNext = res.pagination ? res.pagination.hasNextPage : fetchedList.length === 20;

      if (append) {
        setCustomerOrders((prev) => [...prev, ...fetchedList]);
      } else {
        setCustomerOrders(fetchedList);
      }

      setHasMoreOrders(hasNext);
      setOrdersPage(pageNum);
    } catch (err) {
      console.error("Failed to load customer orders:", err);
      if (!append) setCustomerOrders([]);
    } finally {
      setLoadingCustomerOrders(false);
      setLoadingMoreCustomerOrders(false);
    }
  };

  const handleSelectCustomer = (customer: CustomerProfile) => {
    setSelectedCustomer(customer);
    setOrdersPage(1);
    setHasMoreOrders(false);
    fetchOrdersForCustomer(customer, 1, false);
  };

  const handleScrollOrders = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (hasMoreOrders && !loadingMoreCustomerOrders && !loadingCustomerOrders && selectedCustomer) {
        fetchOrdersForCustomer(selectedCustomer, ordersPage + 1, true);
      }
    }
  };

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
                  onClick={() => handleSelectCustomer(customer)}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs hover:shadow-md hover:border-[#0B392B]/40 transition-all flex flex-col justify-between gap-3 cursor-pointer group"
                >
                  {/* Profile Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-full ${avatarBg} ${avatarText} flex items-center justify-center font-bold text-sm shrink-0 shadow-inner`}
                      >
                        {getInitials(customer.primaryName)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-[#0B251C] group-hover:text-[#0B392B] transition-colors">
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

      {/* Customer Orders Popup Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="-mt-10 bg-white rounded-2xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl flex flex-col gap-4 max-h-[75vh] border border-[#E8E1D3] relative animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0B392B] text-white flex items-center justify-center font-bold text-sm">
                  {getInitials(selectedCustomer.primaryName)}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#0B251C] font-poppins">
                    {selectedCustomer.primaryName}'s Orders
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">
                    Phone: {selectedCustomer.phone} • {selectedCustomer.orderCount} Orders
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Orders List Container */}
            <div
              onScroll={handleScrollOrders}
              className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-3.5 pr-1"
            >
              {loadingCustomerOrders ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <Loader2 className="w-7 h-7 animate-spin text-[#0B392B]" />
                  <span className="text-xs font-semibold">Fetching customer orders...</span>
                </div>
              ) : customerOrders.length === 0 ? (
                <div className="py-16 text-center text-gray-400 flex flex-col items-center gap-2">
                  <ShoppingBag className="w-10 h-10 text-gray-300" />
                  <p className="text-xs font-extrabold text-gray-600">No orders found for this customer.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {customerOrders.map((ord) => (
                    <GlobalOrderCard
                      key={ord._id}
                      order={ord}
                      variant="admin"
                      onCardClick={(clickedOrd) => setSelectedOrderDetails(clickedOrd)}
                      onOrderUpdated={(updatedOrd) => {
                        if (updatedOrd) {
                          setCustomerOrders((prev) =>
                            prev.map((o) => (o._id === updatedOrd._id ? updatedOrd : o))
                          );
                        }
                      }}
                    />
                  ))}
                  {loadingMoreCustomerOrders && (
                    <div className="py-4 flex items-center justify-center gap-2 text-gray-500 text-xs font-bold">
                      <Loader2 className="w-4 h-4 animate-spin text-[#0B392B]" />
                      <span>Loading more orders...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Order Details Modal */}
      <GlobalOrderDetailsModal
        order={selectedOrderDetails}
        variant="admin"
        onClose={() => setSelectedOrderDetails(null)}
      />

      {/* Pinned Bottom Navigation */}
      <AdminBottomNav />
    </div>
  );
}

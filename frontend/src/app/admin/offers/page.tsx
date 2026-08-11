"use client";

import React, { useState } from "react";
import { Search, Plus, Copy, Calendar, Clock, Edit2, Trash2, Check, Tag, RefreshCw } from "lucide-react";
import Header from "@/components/Header";
import AdminBottomNav from "@/components/AdminBottomNav";

interface Offer {
  id: string;
  title: string;
  subtitle: string;
  code: string;
  startDate: string;
  endDate: string;
}

export default function AdminOffersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "expired">("active");

  const [offers, setOffers] = useState<Offer[]>([
    {
      id: "1",
      title: "Welcome New Guest",
      subtitle: "Get 20% off on your first order",
      code: "WELCOME20",
      startDate: "2026-08-01",
      endDate: "2026-12-31",
    },
    {
      id: "2",
      title: "Independence Day Special",
      subtitle: "Save flat ₹100 on orders above ₹500",
      code: "FREEDOM100",
      startDate: "2026-08-10",
      endDate: "2026-08-20",
    },
    {
      id: "3",
      title: "Summer Cooler Discount",
      subtitle: "Free cold beverage on orders above ₹300",
      code: "BEATHEAT",
      startDate: "2026-05-01",
      endDate: "2026-07-31",
    },
    {
      id: "4",
      title: "Monsoon Feast Sale",
      subtitle: "Flat 15% discount on all hot items",
      code: "MONSOON15",
      startDate: "2026-06-01",
      endDate: "2026-08-05",
    },
    {
      id: "5",
      title: "Late Night Cravings",
      subtitle: "Free delivery from 10 PM to 2 AM",
      code: "MIDNIGHTFEAST",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    },
  ]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteOffer = (id: string) => {
    setOffers((prev) => prev.filter((o) => o.id !== id));
  };

  const handleRepostOffer = (id: string) => {
    setOffers((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          const newStart = new Date();
          const newEnd = new Date();
          newEnd.setDate(newStart.getDate() + 30);

          return {
            ...o,
            startDate: newStart.toISOString().split("T")[0],
            endDate: newEnd.toISOString().split("T")[0],
          };
        }
        return o;
      })
    );
    alert("Offer reposted successfully!");
  };

  const now = new Date();

  // Filter based on active vs expired dates
  const filteredOffers = offers.filter((o) => {
    const matchesSearch =
      o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    const start = new Date(o.startDate);
    const end = new Date(o.endDate);

    if (activeTab === "active") {
      return now >= start && now <= end;
    } else {
      return now > end;
    }
  });

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#F4F8FA] relative">
      {/* Header */}
      <Header />

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-5 flex flex-col gap-4 pb-32">
        {/* Title Row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B251C]">
              Offers
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Manage coupons and discounts
            </p>
          </div>

          <button className="bg-[#0B392B] hover:bg-[#07281E] text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer">
            <Plus className="w-4 h-4" /> New Offer
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center shrink-0">
          <Search className="w-4 h-4 absolute left-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search offers or codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#E1ECEE] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#0F261C] placeholder:text-gray-400 focus:outline-none focus:border-[#0B392B]"
          />
        </div>

        {/* Tabs */}
        <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-2xs shrink-0">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "active"
                ? "bg-[#0B392B] text-white shadow-2xs"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab("expired")}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "expired"
                ? "bg-[#0B392B] text-white shadow-2xs"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Expired
          </button>
        </div>

        {/* Offer Cards List */}
        <div className="flex flex-col gap-3.5">
          {filteredOffers.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center flex flex-col items-center gap-3 my-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#0B392B] flex items-center justify-center">
                <Tag className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm">No offers found</h3>
              <p className="text-xs text-gray-500 max-w-xs">
                No {activeTab} offers match your query at the moment.
              </p>
            </div>
          ) : (
            filteredOffers.map((offer) => (
              <div
                key={offer.id}
                className={`rounded-2xl p-4 border flex flex-col gap-3 relative overflow-hidden transition-all ${
                  activeTab === "expired"
                    ? "bg-white/90 border-gray-200 opacity-60 saturate-50 shadow-none"
                    : "bg-white border-[#E1ECEE] shadow-2xs hover:shadow-xs"
                }`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-[#0B251C]">
                      {offer.title}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      {offer.subtitle}
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                      activeTab === "active"
                        ? "bg-[#EAF5EE] text-[#00875A] border border-green-200/50"
                        : "bg-gray-100 text-gray-500 border border-gray-200/50"
                    }`}
                  >
                    {activeTab}
                  </span>
                </div>

                {/* Code Banner */}
                <div
                  className={`rounded-xl p-3 flex items-center justify-between border ${
                    activeTab === "expired"
                      ? "bg-gray-200/50 border-gray-250 text-gray-500"
                      : "bg-[#EBF5FC] border-[#D4E8F8]"
                  }`}
                >
                  <span
                    className={`font-extrabold text-xs tracking-widest font-mono uppercase ${
                      activeTab === "expired" ? "text-gray-500" : "text-[#0B392B]"
                    }`}
                  >
                    {offer.code}
                  </span>
                  <button
                    onClick={() => handleCopyCode(offer.code)}
                    className="p-1 text-gray-500 hover:text-[#0B392B] cursor-pointer"
                    title="Copy Code"
                  >
                    {copiedCode === offer.code ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Dates */}
                <div className="flex flex-col gap-1 text-[11px] text-gray-500 font-semibold bg-gray-50 p-2.5 rounded-xl border border-gray-100/80">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      <strong className="text-gray-600 font-bold">Starts:</strong>{" "}
                      {new Date(offer.startDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      <strong className="text-gray-600 font-bold">Ends:</strong>{" "}
                      {new Date(offer.endDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-around border-t border-gray-100 pt-3 mt-1 text-xs font-bold">
                  {activeTab === "expired" ? (
                    <button
                      onClick={() => handleRepostOffer(offer.id)}
                      className="flex items-center gap-1.5 text-[#0B392B] hover:underline cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Repost Offer
                    </button>
                  ) : (
                    <>
                      <button className="flex items-center gap-1 text-[#0B392B] hover:underline cursor-pointer">
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <div className="w-[1px] h-4 bg-gray-200" />
                      <button
                        onClick={() => handleDeleteOffer(offer.id)}
                        className="flex items-center gap-1 text-[#C51E1E] hover:underline cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pinned Bottom Navigation */}
      <AdminBottomNav />
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Search, Plus, Copy, Calendar, Clock, Edit2, Trash2, Check } from "lucide-react";
import Header from "@/components/Header";
import AdminBottomNav from "@/components/AdminBottomNav";

interface Offer {
  id: string;
  title: string;
  subtitle: string;
  code: string;
  status: "Active" | "Scheduled" | "Expired";
  validity: string;
}

export default function AdminOffersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [offers, setOffers] = useState<Offer[]>([
    {
      id: "1",
      title: "Welcome Discount",
      subtitle: "20% off on first order",
      code: "WELCOME20",
      status: "Active",
      validity: "Valid till Dec 31, 2024",
    },
    {
      id: "2",
      title: "Diwali Special Feast",
      subtitle: "Flat ₹150 off on Party Packs",
      code: "DIWALI150",
      status: "Scheduled",
      validity: "Starts Nov 10, 2024",
    },
    {
      id: "3",
      title: "Monsoon Cravings",
      subtitle: "Free delivery on orders above ₹500",
      code: "RAINYDAY",
      status: "Expired",
      validity: "Expired Aug 31, 2024",
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

  const filteredOffers = offers.filter(
    (o) =>
      o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#F4F8FA] relative">
      {/* Header */}
      <Header />

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 pb-20">
        {/* Title Row */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#0B251C] font-poppins">
            Manage Offers
          </h1>

          <button className="bg-[#0B392B] hover:bg-[#07281E] text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer">
            <Plus className="w-4 h-4" /> New Offer
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="w-5 h-5 absolute left-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search offers or codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#E8F0F2] rounded-xl py-3 pl-11 pr-4 text-xs text-[#0F261C] placeholder:text-gray-400 focus:outline-none focus:border-[#0B392B]"
          />
        </div>

        {/* Offer Cards List */}
        <div className="flex flex-col gap-3.5">
          {filteredOffers.map((offer) => (
            <div
              key={offer.id}
              className={`bg-white rounded-2xl p-4 border shadow-2xs flex flex-col gap-3 relative overflow-hidden ${
                offer.status === "Active"
                  ? "border-t-4 border-t-[#00875A] border-gray-100"
                  : offer.status === "Scheduled"
                  ? "border-t-4 border-t-[#FFB800] border-gray-100"
                  : "border-t-4 border-t-gray-400 border-gray-100"
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
                  className={`px-3 py-0.5 rounded-full text-[11px] font-bold ${
                    offer.status === "Active"
                      ? "bg-[#EAF5EE] text-[#00875A]"
                      : offer.status === "Scheduled"
                      ? "bg-[#FFF8E6] text-[#D97706]"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {offer.status}
                </span>
              </div>

              {/* Code Banner */}
              <div className="bg-[#EBF5FC] rounded-xl p-3 flex items-center justify-between border border-[#D4E8F8]">
                <span className="font-extrabold text-sm text-[#0B392B] tracking-wider font-mono">
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

              {/* Date & Validity */}
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                {offer.status === "Expired" ? (
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                ) : (
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                )}
                <span>{offer.validity}</span>
              </div>

              {/* Edit & Delete Action Buttons */}
              <div className="flex items-center justify-around border-t border-gray-100 pt-3 mt-1 text-xs font-bold">
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

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Plus, Copy, Calendar, Edit2, Trash2, Check, Tag, RefreshCw, Power, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import AdminBottomNav from "@/components/AdminBottomNav";
import { getOffers, deleteOffer, repostOffer, toggleOfferActive, Offer } from "@/services/offerService";

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "expired">("active");

  const fetchOffersList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOffers({
        search: searchQuery,
        type: activeTab === "active" ? "active" : "others",
      });
      setOffers(data);
    } catch (err) {
      console.error("Failed to fetch offers:", err);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeTab]);

  useEffect(() => {
    fetchOffersList();
  }, [fetchOffersList]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;
    try {
      await deleteOffer(id);
      await fetchOffersList();
    } catch (err: any) {
      alert(err?.message || "Failed to delete offer.");
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await toggleOfferActive(id);
      await fetchOffersList();
    } catch (err: any) {
      alert(err?.message || "Failed to update offer active state.");
    }
  };

  const handleRepostOffer = async (id: string) => {
    try {
      await repostOffer(id);
      alert("Offer reposted successfully! Validity extended by 30 days.");
      await fetchOffersList();
    } catch (err: any) {
      alert(err?.message || "Failed to repost offer.");
    }
  };

  const getSubtitle = (o: Offer) => {
    if (o.offerType === "BOGO") {
      const buyName = o.buyItem?.name || "Item";
      const freeName = o.freeItem?.name || "Item";
      return `Buy ${o.buyQuantity || 1} ${buyName}, Get ${o.freeQuantity || 1} ${freeName} FREE!`;
    } else if (o.offerType === "PERCENTAGE") {
      return `Get ${o.discountPercentage}% OFF on orders above ₹${o.minCartValue} (Max ₹${o.maxDiscountAmount} off)`;
    } else {
      return `Flat ₹${o.flatDiscountAmount} OFF on orders above ₹${o.minCartValue} (Max ₹${o.maxDiscountAmount} off)`;
    }
  };

  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#F4F8FA] relative">
      {/* Header */}
      <Header />

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-5 flex flex-col gap-4 pb-32 max-w-4xl mx-auto w-full">
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

          <Link
            href="/admin/offers/create"
            className="bg-[#0B392B] hover:bg-[#07281E] text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" /> New Offer
          </Link>
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
            Active Offers
          </button>
          <button
            onClick={() => setActiveTab("expired")}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "expired"
                ? "bg-[#0B392B] text-white shadow-2xs"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Expired / Inactive
          </button>
        </div>

        {/* Offer Cards List */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-gray-400 gap-2">
            <Loader2 className="w-7 h-7 animate-spin text-[#0B392B]" />
            <span className="text-xs font-semibold">Loading offers...</span>
          </div>
        ) : offers.length === 0 ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offers.map((offer) => (
              <div
                key={offer._id}
                className={`rounded-2xl p-4 border flex flex-col justify-between gap-3 relative overflow-hidden transition-all ${
                  activeTab === "expired" || offer.status === "expired" || !offer.isActive
                    ? "bg-white/90 border-gray-200 opacity-70 saturate-50 shadow-none"
                    : "bg-white border-[#E1ECEE] shadow-2xs hover:shadow-xs"
                }`}
              >
                {/* Header row with thumbnail */}
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100 relative">
                    <img src={offer.image} alt={offer.title} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-extrabold text-sm text-[#0B251C] truncate">
                        {offer.title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider shrink-0 border ${
                          offer.offerType === "BOGO"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : offer.offerType === "PERCENTAGE"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-orange-50 text-orange-700 border-orange-200"
                        }`}
                      >
                        {offer.offerType}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 font-medium leading-snug line-clamp-2">
                      {getSubtitle(offer)}
                    </p>
                  </div>
                </div>

                {/* Code Banner */}
                <div
                  className={`rounded-xl p-2.5 flex items-center justify-between border ${
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

                {/* Dates & Status */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold bg-gray-50 p-2 rounded-xl border border-gray-100/80">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      {formatDateStr(offer.startDate)} - {formatDateStr(offer.endDate)}
                    </span>
                  </div>
                  <span
                    className={`font-bold capitalize ${
                      offer.status === "expired"
                        ? "text-red-500"
                        : offer.status === "inactive"
                        ? "text-gray-500"
                        : "text-emerald-700"
                    }`}
                  >
                    ● {offer.status || (offer.isActive ? "active" : "inactive")}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-2.5 mt-0.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleActive(offer._id)}
                      className={`p-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                        offer.isActive
                          ? "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      }`}
                      title="Toggle Active/Inactive"
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{offer.isActive ? "Deactivate" : "Activate"}</span>
                    </button>
                  </div>

                  {activeTab === "active" ? (
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/admin/offers/create?id=${offer._id}`}
                        className="p-1.5 text-gray-600 hover:text-[#0B392B] hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                        title="Edit Offer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteOffer(offer._id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                        title="Delete Offer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    /* Repost Action for Expired Offers */
                    <button
                      onClick={() => handleRepostOffer(offer._id)}
                      className="bg-[#0B392B] hover:bg-[#07281E] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Repost Offer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pinned Bottom Nav */}
      <AdminBottomNav />
    </div>
  );
}

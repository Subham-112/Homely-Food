"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { X, Tag, Calendar, Sparkles, Image as ImageIcon, Loader2, Save } from "lucide-react";
import Header from "@/components/Header";
import AdminBottomNav from "@/components/AdminBottomNav";
import { createOffer, updateOffer, getOfferById, CreateOfferPayload } from "@/services/offerService";
import { getCompactMenuItems, CompactMenuItem } from "@/services/orderService";

function OfferFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [offerType, setOfferType] = useState<"BOGO" | "PERCENTAGE" | "FLAT">("FLAT");
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  // BOGO Fields
  const [buyItem, setBuyItem] = useState("");
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [freeItem, setFreeItem] = useState("");
  const [freeQuantity, setFreeQuantity] = useState(1);

  // Percentage & Flat Fields (no default values, start empty)
  const [minCartValue, setMinCartValue] = useState<number | "">("");
  const [discountPercentage, setDiscountPercentage] = useState<number | "">("");
  const [flatDiscountAmount, setFlatDiscountAmount] = useState<number | "">("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | "">("");

  // Menu Items for BOGO select
  const [menuItems, setMenuItems] = useState<CompactMenuItem[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initData = async () => {
      setLoadingInitial(true);
      try {
        // Fetch menu items for BOGO dropdowns
        const res = await getCompactMenuItems({ limit: 100 });
        setMenuItems(res.items || []);

        if (editId) {
          const offer = await getOfferById(editId);
          if (offer) {
            setOfferType(offer.offerType);
            setTitle(offer.title || "");
            setCode(offer.code || "");
            setDescription(offer.description || "");
            setImage(offer.image || "");
            setStartDate(offer.startDate ? offer.startDate.split("T")[0] : "");
            setEndDate(offer.endDate ? offer.endDate.split("T")[0] : "");
            setIsActive(offer.isActive !== undefined ? offer.isActive : true);

            setBuyItem(offer.buyItem ? offer.buyItem._id : "");
            setBuyQuantity(offer.buyQuantity || 1);
            setFreeItem(offer.freeItem ? offer.freeItem._id : "");
            setFreeQuantity(offer.freeQuantity || 1);

            setMinCartValue(offer.minCartValue !== undefined ? offer.minCartValue : "");
            setDiscountPercentage(offer.discountPercentage !== undefined ? offer.discountPercentage : "");
            setFlatDiscountAmount(offer.flatDiscountAmount !== undefined ? offer.flatDiscountAmount : "");
            setMaxDiscountAmount(offer.maxDiscountAmount !== undefined ? offer.maxDiscountAmount : "");
          }
        } else {
          // Defaults for new offer creation
          const today = new Date().toISOString().split("T")[0];
          const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

          setOfferType("FLAT");
          setTitle("");
          setCode("");
          setDescription("");
          setImage("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80");
          setStartDate(today);
          setEndDate(nextMonth);
          setIsActive(true);
          setMinCartValue("");
          setDiscountPercentage("");
          setFlatDiscountAmount("");
          setMaxDiscountAmount("");
        }
      } catch (err: any) {
        console.error("Failed to load initial form data:", err);
        setError("Failed to load offer details.");
      } finally {
        setLoadingInitial(false);
      }
    };

    initData();
  }, [editId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Offer title is required.");
      return;
    }
    if (!image.trim()) {
      setError("Offer image is mandatory.");
      return;
    }
    if (!startDate) {
      setError("Start date is required.");
      return;
    }
    if (!endDate) {
      setError("End date is required.");
      return;
    }

    const payload: CreateOfferPayload = {
      offerType,
      title: title.trim(),
      description: description.trim(),
      image: image.trim(),
      startDate,
      endDate,
      isActive,
    };

    if (code) {
      payload.code = code;
    }

    if (offerType === "BOGO") {
      if (!buyItem) {
        setError("Please select a Buy Item.");
        return;
      }
      if (!freeItem) {
        setError("Please select a Free Item.");
        return;
      }
      payload.buyItem = buyItem;
      payload.buyQuantity = Number(buyQuantity);
      payload.freeItem = freeItem;
      payload.freeQuantity = Number(freeQuantity);
    } else if (offerType === "PERCENTAGE") {
      if (minCartValue === "" || Number(minCartValue) < 0) {
        setError("Minimum cart value is required.");
        return;
      }
      if (discountPercentage === "" || Number(discountPercentage) <= 0 || Number(discountPercentage) > 100) {
        setError("Valid discount percentage (1-100%) is required.");
        return;
      }
      if (maxDiscountAmount === "" || Number(maxDiscountAmount) < 0) {
        setError("Maximum discount cap amount is required.");
        return;
      }
      payload.minCartValue = Number(minCartValue);
      payload.discountPercentage = Number(discountPercentage);
      payload.maxDiscountAmount = Number(maxDiscountAmount);
    } else if (offerType === "FLAT") {
      if (minCartValue === "" || Number(minCartValue) < 0) {
        setError("Minimum cart value is required.");
        return;
      }
      if (flatDiscountAmount === "" || Number(flatDiscountAmount) <= 0) {
        setError("Flat discount amount is required.");
        return;
      }
      if (maxDiscountAmount === "" || Number(maxDiscountAmount) < 0) {
        setError("Maximum discount cap amount is required.");
        return;
      }
      payload.minCartValue = Number(minCartValue);
      payload.flatDiscountAmount = Number(flatDiscountAmount);
      payload.maxDiscountAmount = Number(maxDiscountAmount);
    }

    setSubmitting(true);
    try {
      if (editId) {
        await updateOffer(editId, payload);
      } else {
        await createOffer(payload);
      }
      router.push("/admin/offers");
    } catch (err: any) {
      setError(err?.message || "Failed to save offer.");
      setSubmitting(false);
    }
  };

  // Helpers for live preview
  const selectedBuyItemObj = menuItems.find((i) => i._id === buyItem);
  const selectedFreeItemObj = menuItems.find((i) => i._id === freeItem);

  let previewSubtitle = "";
  if (offerType === "BOGO") {
    const buyName = selectedBuyItemObj?.name || "Item";
    const freeName = selectedFreeItemObj?.name || "Item";
    previewSubtitle = `Buy ${buyQuantity} ${buyName}, Get ${freeQuantity} ${freeName} FREE!`;
  } else if (offerType === "PERCENTAGE") {
    previewSubtitle = `Get ${discountPercentage || 0}% OFF on orders above ₹${minCartValue || 0} (Max ₹${maxDiscountAmount || 0} off)`;
  } else {
    previewSubtitle = `Flat ₹${flatDiscountAmount || 0} OFF on orders above ₹${minCartValue || 0} (Max ₹${maxDiscountAmount || 0} off)`;
  }

  if (loadingInitial) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-gray-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B392B]" />
        <span className="text-xs font-semibold">Loading offer details...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 sm:p-5 max-w-2xl mx-auto w-full flex flex-col gap-4 pb-32">
      {/* Title Bar with Cross Button on the Right */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B251C] flex items-center gap-2 font-poppins">
            <Sparkles className="w-5 h-5 text-[#0B392B]" />
            {editId ? "Edit Offer" : "Create Offer"}
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            Configure discount rules and parameters
          </p>
        </div>

        <Link
          href="/admin/offers"
          className="p-2 rounded-xl text-gray-400 hover:text-gray-700 bg-white border border-[#E1ECEE] shadow-2xs transition-all cursor-pointer shrink-0"
          title="Close"
        >
          <X className="w-5 h-5" />
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-xs font-semibold p-3.5 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Offer Type Tabs */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">Offer Type *</label>
          <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-2xs">
            {(["FLAT", "PERCENTAGE", "BOGO"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setOfferType(type)}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  offerType === type
                    ? "bg-[#0B392B] text-white shadow-2xs"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {type === "FLAT" ? "Flat Off" : type === "PERCENTAGE" ? "Percentage Off" : "BOGO Offer"}
              </button>
            ))}
          </div>
        </div>

        {/* Common Field: Offer Title */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Offer Title *</label>
          <input
            type="text"
            placeholder="e.g. Independence Day Special"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white border border-[#E1ECEE] rounded-xl py-2.5 px-3.5 text-xs text-[#0F261C] placeholder:text-gray-400 focus:outline-none focus:border-[#0B392B]"
          />
        </div>

        {/* Image & Description */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Offer Image URL (Mandatory) *</label>
          <input
            type="text"
            placeholder="https://images.unsplash.com/..."
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="w-full bg-white border border-[#E1ECEE] rounded-xl py-2.5 px-3.5 text-xs font-mono text-[#0F261C] placeholder:text-gray-400 focus:outline-none focus:border-[#0B392B]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Description (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Get 20% off on all main course items"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-white border border-[#E1ECEE] rounded-xl py-2.5 px-3.5 text-xs text-[#0F261C] placeholder:text-gray-400 focus:outline-none focus:border-[#0B392B]"
          />
        </div>

        {/* Dates Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Start Date *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white border border-[#E1ECEE] rounded-xl py-2.5 px-3.5 text-xs font-semibold text-[#0F261C] focus:outline-none focus:border-[#0B392B]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">End Date *</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white border border-[#E1ECEE] rounded-xl py-2.5 px-3.5 text-xs font-semibold text-[#0F261C] focus:outline-none focus:border-[#0B392B]"
            />
          </div>
        </div>

        {/* Dynamic Conditional Fields based on Offer Type */}
        {offerType === "BOGO" && (
          <div className="bg-white border border-[#E1ECEE] p-4 rounded-2xl shadow-2xs flex flex-col gap-3">
            <span className="text-xs font-extrabold text-[#0B392B]">BOGO Details</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">With / Buy Item *</label>
                <select
                  value={buyItem}
                  onChange={(e) => setBuyItem(e.target.value)}
                  className="w-full bg-white border border-[#E1ECEE] rounded-xl py-2.5 px-3 text-xs font-semibold text-[#0F261C] focus:outline-none focus:border-[#0B392B]"
                >
                  <option value="">Select Item...</option>
                  {menuItems.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name} (₹{item.price})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Buy Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={buyQuantity}
                  onChange={(e) => setBuyQuantity(Number(e.target.value))}
                  className="w-full bg-white border border-[#E1ECEE] rounded-xl py-2.5 px-3 text-xs font-bold text-[#0F261C] focus:outline-none focus:border-[#0B392B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Free Item *</label>
                <select
                  value={freeItem}
                  onChange={(e) => setFreeItem(e.target.value)}
                  className="w-full bg-white border border-[#E1ECEE] rounded-xl py-2.5 px-3 text-xs font-semibold text-[#0F261C] focus:outline-none focus:border-[#0B392B]"
                >
                  <option value="">Select Free Item...</option>
                  {menuItems.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name} (₹{item.price})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Free Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={freeQuantity}
                  onChange={(e) => setFreeQuantity(Number(e.target.value))}
                  className="w-full bg-white border border-[#E1ECEE] rounded-xl py-2.5 px-3 text-xs font-bold text-[#0F261C] focus:outline-none focus:border-[#0B392B]"
                />
              </div>
            </div>
          </div>
        )}

        {offerType === "PERCENTAGE" && (
          <div className="bg-white border border-[#E1ECEE] p-4 rounded-2xl shadow-2xs flex flex-col gap-3">
            <span className="text-xs font-extrabold text-[#0B392B]">Percentage Discount Details</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Min Cart Value (₹) *</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Enter min cart value"
                  value={minCartValue}
                  onChange={(e) => setMinCartValue(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-white border border-[#E1ECEE] rounded-xl py-2.5 px-3 text-xs font-bold text-[#0F261C] focus:outline-none focus:border-[#0B392B]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Discount (% Off) *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="Enter percentage"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-white border border-[#E1ECEE] rounded-xl py-2.5 px-3 text-xs font-bold text-[#0F261C] focus:outline-none focus:border-[#0B392B]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Max Discount Cap (₹) *</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Enter max cap"
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-white border border-[#E1ECEE] rounded-xl py-2.5 px-3 text-xs font-bold text-[#0F261C] focus:outline-none focus:border-[#0B392B]"
                />
              </div>
            </div>
          </div>
        )}

        {offerType === "FLAT" && (
          <div className="bg-white border border-[#E1ECEE] p-4 rounded-2xl shadow-2xs flex flex-col gap-3">
            <span className="text-xs font-extrabold text-[#0B392B]">Flat Discount Details</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Min Cart Value (₹) *</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Enter min cart value"
                  value={minCartValue}
                  onChange={(e) => setMinCartValue(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-white border border-[#E1ECEE] rounded-xl py-2.5 px-3 text-xs font-bold text-[#0F261C] focus:outline-none focus:border-[#0B392B]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Flat Discount (₹ Off) *</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Enter flat discount"
                  value={flatDiscountAmount}
                  onChange={(e) => setFlatDiscountAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-white border border-[#E1ECEE] rounded-xl py-2.5 px-3 text-xs font-bold text-[#0F261C] focus:outline-none focus:border-[#0B392B]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Max Discount Cap (₹) *</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Enter max cap"
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-white border border-[#E1ECEE] rounded-xl py-2.5 px-3 text-xs font-bold text-[#0F261C] focus:outline-none focus:border-[#0B392B]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Live Preview Container at the bottom of the page */}
        <div className="pt-2 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[#0B392B]" /> Real-Time Live Offer Preview
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#0B392B]">
              Live Component
            </span>
          </div>

          {/* Rendered Live Card Component */}
          <div className="bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] rounded-2xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200 relative">
                {image ? (
                  <img src={image} alt="Offer Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-extrabold text-sm text-[#0B251C] truncate">
                    {title || "Offer Title Placeholder"}
                  </h4>
                  <span className="bg-emerald-50 text-[#0B392B] border border-emerald-200 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                    {offerType}
                  </span>
                </div>
                <p className="text-xs text-gray-600 font-medium leading-snug">
                  {previewSubtitle}
                </p>
                {description && (
                  <p className="text-[11px] text-gray-400 font-normal italic truncate">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {/* Code & Validity Row */}
            <div className="flex items-center justify-between border-t border-gray-200/80 pt-2.5 text-[11px]">
              <div className="flex items-center gap-1 font-mono font-bold text-[#0B392B] bg-white px-3 py-1 rounded-lg border border-gray-200/80 shadow-2xs">
                <span>{code || "AUTO-GENERATED ON SAVE"}</span>
              </div>
              <div className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>Valid: {startDate || "YYYY-MM-DD"} to {endDate || "YYYY-MM-DD"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Submit Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Link
            href="/admin/offers"
            className="px-5 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-200/60 rounded-xl cursor-pointer transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#0B392B] hover:bg-[#07281E] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {editId ? "Update Offer" : "Save & Create Offer"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CreateOfferPage() {
  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#F4F8FA] relative">
      <Header />
      <Suspense fallback={
        <div className="py-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0B392B]" />
        </div>
      }>
        <OfferFormContent />
      </Suspense>
      <AdminBottomNav />
    </div>
  );
}

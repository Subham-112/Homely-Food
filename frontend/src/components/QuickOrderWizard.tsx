"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Plus,
  Minus,
  X,
  Search,
  ChevronRight,
  User,
  Phone,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Tag,
  Check,
  Trash2,
} from "lucide-react";
import MenuItemCard from "@/components/MenuItemCard";
import {
  getCompactMenuItems,
  searchUserByPhone,
  createOrder,
  CompactMenuItem,
  SearchedUser,
  CreateOrderPayload,
} from "@/services/orderService";
import { getOffers, Offer } from "@/services/offerService";

interface QuickOrderWizardProps {
  onSuccess?: (orderNumber: string) => void;
  onCancel?: () => void;
  isStandalonePage?: boolean;
}

export default function QuickOrderWizard({
  onSuccess,
  onCancel,
  isStandalonePage = false,
}: QuickOrderWizardProps) {
  const router = useRouter();

  // Wizard Step: 1 = Item Selection, 2 = Guest Details & Checkout
  const [step, setStep] = useState<1 | 2>(1);

  // Success Toast state
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);
  const [orderSuccessNumber, setOrderSuccessNumber] = useState<string>("");

  // Menu Items & Pagination States
  const [items, setItems] = useState<CompactMenuItem[]>([]);
  const [loadingItems, setLoadingItems] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Selected Cart Items State
  const [cart, setCart] = useState<Record<string, { item: CompactMenuItem; quantity: number }>>({});

  // Checkout Form State
  const [guestPhone, setGuestPhone] = useState<string>("");
  const [guestName, setGuestName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [orderType, setOrderType] = useState<"dine-in" | "delivery" | "pickup">("dine-in");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [pickupTiming, setPickupTiming] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Offers State & Calculation
  const [availableOffers, setAvailableOffers] = useState<Offer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [couponCodeInput, setCouponCodeInput] = useState<string>("");
  const [couponFeedback, setCouponFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Phone Search Auto-Complete State
  const [searchedUsers, setSearchedUsers] = useState<SearchedUser[]>([]);
  const [isSearchingPhone, setIsSearchingPhone] = useState<boolean>(false);
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const phoneContainerRef = useRef<HTMLDivElement | null>(null);
  const skipNextPhoneSearch = useRef<boolean>(false);

  // Fetch Compact Menu Items
  const fetchItemsPage = async (pageNum: number, searchStr: string, isAppend = false) => {
    if (isAppend) {
      setLoadingMore(true);
    } else {
      setLoadingItems(true);
    }

    try {
      const res = await getCompactMenuItems({ search: searchStr, page: pageNum, limit: 16 });
      if (isAppend) {
        setItems((prev) => {
          const existingIds = new Set(prev.map((i) => i._id));
          const newUnique = res.items.filter((i) => !existingIds.has(i._id));
          return [...prev, ...newUnique];
        });
      } else {
        setItems(res.items);
      }
      setPage(res.pagination.page);
      setHasNextPage(res.pagination.hasNextPage);
    } catch (err) {
      console.error("Failed to fetch menu items for order:", err);
    } finally {
      setLoadingItems(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchItemsPage(1, "", false);
  }, []);

  // Fetch Active Offers once
  useEffect(() => {
    const fetchActiveOffers = async () => {
      try {
        const offers = await getOffers({ type: "active" });
        setAvailableOffers(offers);
      } catch (err) {
        console.error("Failed to load active offers for quick order:", err);
      }
    };
    fetchActiveOffers();
  }, []);

  // Auto-dismiss success toast after 4s
  useEffect(() => {
    if (!orderSuccess) return;
    const timer = setTimeout(() => setOrderSuccess(false), 4000);
    return () => clearTimeout(timer);
  }, [orderSuccess]);

  // Debounced Search Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItemsPage(1, searchTerm, false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Infinite Scroll Handler for Page Container
  const handlePageScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (step !== 1) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (
      scrollHeight - scrollTop - clientHeight < 100 &&
      hasNextPage &&
      !loadingMore &&
      !loadingItems
    ) {
      fetchItemsPage(page + 1, searchTerm, true);
    }
  };

  // Cart Operations
  const handleAddToCart = (item: CompactMenuItem) => {
    setCart((prev) => {
      const current = prev[item._id]?.quantity || 0;
      return {
        ...prev,
        [item._id]: { item, quantity: current + 1 },
      };
    });
  };

  const handleDecrementCart = (itemId: string) => {
    setCart((prev) => {
      const current = prev[itemId]?.quantity || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return {
        ...prev,
        [itemId]: { ...prev[itemId], quantity: current - 1 },
      };
    });
  };

  const cartEntries = Object.values(cart);
  const totalItemCount = cartEntries.reduce((sum, entry) => sum + entry.quantity, 0);
  const subTotal = cartEntries.reduce(
    (sum, entry) => sum + entry.item.price * entry.quantity,
    0
  );

  // Offer Discount Calculation
  const calculateDiscount = (): number => {
    if (!selectedOffer) return 0;
    if (selectedOffer.minCartValue && subTotal < selectedOffer.minCartValue) {
      return 0;
    }
    if (selectedOffer.offerType === "FLAT") {
      return selectedOffer.flatDiscountAmount || 0;
    }
    if (selectedOffer.offerType === "PERCENTAGE") {
      const pct = selectedOffer.discountPercentage || 0;
      const rawDiscount = (subTotal * pct) / 100;
      if (selectedOffer.maxDiscountAmount && rawDiscount > selectedOffer.maxDiscountAmount) {
        return selectedOffer.maxDiscountAmount;
      }
      return rawDiscount;
    }
    return 0;
  };

  const discountAmount = calculateDiscount();
  const finalTotalAmount = Math.max(0, subTotal - discountAmount);

  // Apply Coupon Handler
  const handleApplyCouponCode = (codeToApply?: string) => {
    setCouponFeedback(null);
    const code = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!code) {
      setCouponFeedback({ success: false, message: "Please enter a valid coupon code." });
      return;
    }

    const matched = availableOffers.find((off) => off.code.toUpperCase() === code);
    if (!matched) {
      setCouponFeedback({ success: false, message: "Invalid or expired coupon code." });
      return;
    }

    if (matched.minCartValue && subTotal < matched.minCartValue) {
      setCouponFeedback({
        success: false,
        message: `Minimum cart value of ₹${matched.minCartValue} required for this coupon.`,
      });
      return;
    }

    setSelectedOffer(matched);
    setCouponCodeInput(matched.code);
    setCouponFeedback({ success: true, message: `Coupon '${matched.code}' applied successfully!` });
  };

  const handleRemoveCoupon = () => {
    setSelectedOffer(null);
    setCouponCodeInput("");
    setCouponFeedback(null);
  };

  // Phone Input Auto-Search
  useEffect(() => {
    if (skipNextPhoneSearch.current) {
      skipNextPhoneSearch.current = false;
      return;
    }

    setSelectedUserId(null);

    if (!guestPhone.trim() || guestPhone.trim().length < 3) {
      setSearchedUsers([]);
      setShowPhoneSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingPhone(true);
      try {
        const results = await searchUserByPhone(guestPhone);
        setSearchedUsers(results);
        setShowPhoneSuggestions(results.length > 0);
      } catch (err) {
        console.error("Failed to search user by phone:", err);
      } finally {
        setIsSearchingPhone(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [guestPhone]);

  // Click Outside Phone Suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        phoneContainerRef.current &&
        !phoneContainerRef.current.contains(e.target as Node)
      ) {
        setShowPhoneSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestedUser = (user: SearchedUser) => {
    skipNextPhoneSearch.current = true;
    setGuestPhone(user.phone);
    setGuestName(user.name);
    setSelectedUserId(user._id);
    setSearchedUsers([]);
    setShowPhoneSuggestions(false);
  };

  // Scroll Container Ref
  const scrollContentRef = useRef<HTMLDivElement | null>(null);

  // Step Switch Handler
  const handleContinueToStep2 = () => {
    if (totalItemCount === 0) return;
    setFormError(null);
    setStep(2);
    if (scrollContentRef.current) {
      scrollContentRef.current.scrollTop = 0;
    }
  };

  // Submit Order Handler
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!guestPhone.trim()) {
      setFormError("Guest mobile number is required.");
      return;
    }
    if (!guestName.trim()) {
      setFormError("Guest name is required.");
      return;
    }
    if (totalItemCount === 0) {
      setFormError("Please select at least one item.");
      return;
    }
    if (orderType === "delivery" && (!deliveryAddress || !deliveryAddress.trim())) {
      setFormError("Delivery address is required for delivery orders.");
      return;
    }
    if (orderType === "pickup" && (!pickupTiming || !pickupTiming.trim())) {
      setFormError("Pickup date and time are required for pickup orders.");
      return;
    }

    const payload: CreateOrderPayload = {
      ...(selectedUserId ? { userId: selectedUserId } : {}),
      guest: {
        name: guestName.trim(),
        phone: guestPhone.trim(),
      },
      items: cartEntries.map((entry) => ({
        menuItem: entry.item._id,
        name: entry.item.name,
        price: entry.item.price,
        quantity: entry.quantity,
      })),
      notes: notes.trim(),
      discount: discountAmount,
      offerCode: selectedOffer ? selectedOffer.code : undefined,
      offer: selectedOffer ? selectedOffer._id : undefined,
      orderType,
      deliveryAddress: orderType === "delivery" ? deliveryAddress.trim() : undefined,
      pickupTiming: orderType === "pickup" ? new Date(pickupTiming).toISOString() : undefined,
    };

    setIsSubmitting(true);
    try {
      const createdOrder = await createOrder(payload);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("order-created", { detail: createdOrder }));
      }
      setOrderSuccessNumber(createdOrder.orderNumber || "ORD-SUCCESS");
      setOrderSuccess(true);

      if (onSuccess) {
        onSuccess(createdOrder.orderNumber || "ORD-SUCCESS");
      }

      // Reset cart and form
      setCart({});
      setGuestPhone("");
      setGuestName("");
      setNotes("");
      setDeliveryAddress("");
      setPickupTiming("");
      setOrderType("dine-in");
      setSelectedUserId(null);
      setSelectedOffer(null);
      setCouponCodeInput("");
      setCouponFeedback(null);
      setStep(1);

      if (isStandalonePage) {
        setTimeout(() => {
          router.push("/admin/orders");
        }, 1500);
      }
    } catch (err: any) {
      setFormError(err?.message || "Failed to create order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#FAF6ED] relative">
      {/* 1. Sticky Header Bar at Top */}
      <div className="sticky top-0 z-30 bg-[#FAF6ED]/95 backdrop-blur-md px-4 py-3 border-b border-[#E8E1D3] flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (step === 2) {
                  setStep(1);
                  if (scrollContentRef.current) {
                    scrollContentRef.current.scrollTop = 0;
                  }
                } else {
                  router.back();
                }
              }}
              className="p-2 rounded-xl bg-white border border-[#E8E1D3] hover:bg-gray-100 text-[#0B251C] transition-all cursor-pointer shadow-2xs"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-[#0B251C] font-poppins leading-tight">
                Create Quick Order
              </h1>
              <p className="text-[11px] text-gray-500 font-medium">
                {step === 1 ? "Step 1 of 2: Select Items" : "Step 2 of 2: Guest Details & Checkout"}
              </p>
            </div>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search Bar - Sticky with Header in Step 1 */}
        {step === 1 && (
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search items by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-[#E8E1D3] rounded-2xl focus:outline-none focus:border-[#0B392B] shadow-2xs"
            />
          </div>
        )}
      </div>

      {/* 2. Middle Scrollable Content Area */}
      <div
        ref={scrollContentRef}
        onScroll={handlePageScroll}
        className="flex-1 overflow-y-auto no-scrollbar p-3.5 sm:p-5 max-w-4xl w-full mx-auto pb-32"
      >
        {step === 1 ? (
          /* Step 1 View: Menu Items List */
          loadingItems ? (
            <div className="py-24 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-[#0B392B]" />
              <span className="text-xs font-semibold">Loading menu items...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-24 text-center text-gray-400 text-xs italic">
              No menu items found.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {items.map((item) => {
                  const quantity = cart[item._id]?.quantity || 0;
                  return (
                    <MenuItemCard
                      key={item._id}
                      item={{
                        id: item._id,
                        name: item.name,
                        price: item.price,
                        image: item.image,
                      }}
                      quantity={quantity}
                      onAdd={(cardItem) =>
                        handleAddToCart({
                          _id: cardItem.id,
                          name: cardItem.name,
                          price: cardItem.price,
                          image: cardItem.image || "",
                        })
                      }
                      onUpdateQuantity={(id, delta) => {
                        if (delta > 0) {
                          const found = items.find((i) => i._id === id);
                          if (found) handleAddToCart(found);
                        } else {
                          handleDecrementCart(id);
                        }
                      }}
                    />
                  );
                })}
              </div>

              {loadingMore && (
                <div className="py-6 flex items-center justify-center gap-2 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin text-[#0B392B]" />
                  <span className="text-xs font-semibold">Loading more delicious items...</span>
                </div>
              )}
            </div>
          )
        ) : (
          /* Step 2 View: Guest Details & Checkout */
          <div className="flex flex-col gap-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-2xl font-semibold">
                {formError}
              </div>
            )}

            {/* Selected Items Review */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8E1D3] shadow-2xs flex flex-col gap-2.5">
              <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                Selected Order Items ({totalItemCount})
              </h4>
              <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
                {cartEntries.map(({ item, quantity }) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs"
                  >
                    <span className="font-extrabold text-[#0B251C] truncate max-w-[200px]">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 font-semibold">
                        {quantity} x ₹{item.price}
                      </span>
                      <span className="font-extrabold text-[#0B392B]">
                        ₹{quantity * item.price}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2.5 border-t border-gray-100 flex flex-col gap-1 text-xs">
                <div className="flex justify-between text-gray-600 font-medium">
                  <span>Subtotal</span>
                  <span>₹{subTotal}</span>
                </div>

                {selectedOffer && discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" /> Coupon ({selectedOffer.code})
                    </span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}

                <div className="flex justify-between font-extrabold text-sm text-[#0B392B] pt-1.5 border-t border-gray-200">
                  <span>Total Amount</span>
                  <span>₹{finalTotalAmount}</span>
                </div>
              </div>
            </div>

            {/* Apply Offer / Coupon Section */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8E1D3] shadow-2xs flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#0B392B]" />
                <h4 className="text-xs font-extrabold text-[#0B251C] uppercase tracking-wider">
                  Apply Offer / Coupon
                </h4>
              </div>

              {selectedOffer ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                  <div>
                    <span className="font-mono font-extrabold text-[#0B392B] text-xs block">
                      {selectedOffer.code} APPLIED
                    </span>
                    <span className="text-[11px] text-emerald-800 font-medium">
                      You saved ₹{discountAmount}!
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="ENTER COUPON CODE"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0B251C] uppercase placeholder:text-gray-400 focus:outline-none focus:border-[#0B392B]"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyCouponCode()}
                      className="bg-[#0B392B] hover:bg-[#07281E] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                      APPLY
                    </button>
                  </div>

                  {couponFeedback && (
                    <div
                      className={`text-xs font-semibold px-3 py-2 rounded-xl border ${
                        couponFeedback.success
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {couponFeedback.message}
                    </div>
                  )}

                  {availableOffers.length > 0 && (
                    <div className="flex flex-col gap-1.5 pt-1">
                      <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                        Available Coupons
                      </span>
                      <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto no-scrollbar">
                        {availableOffers.map((off) => (
                          <div
                            key={off._id}
                            className="flex items-center justify-between bg-gray-50 border border-gray-200/80 p-2.5 rounded-xl text-xs"
                          >
                            <div>
                              <span className="font-mono font-bold text-[#0B392B] block">
                                {off.code}
                              </span>
                              <span className="text-[10px] text-gray-500 line-clamp-1">
                                {off.title} (Min ₹{off.minCartValue || 0})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleApplyCouponCode(off.code)}
                              className="text-[11px] font-extrabold text-[#0B392B] hover:underline cursor-pointer px-2 py-1"
                            >
                              Apply
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmitOrder} className="flex flex-col gap-4">
              <div className="bg-white p-4 rounded-2xl border border-[#E8E1D3] shadow-2xs flex flex-col gap-3.5">
                {/* Order Type Selection */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 mb-1">
                    Order Type *
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-2xl text-xs font-bold">
                    {(["dine-in", "delivery", "pickup"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setOrderType(type)}
                        className={`py-2 rounded-xl text-center cursor-pointer transition-all capitalize ${
                          orderType === type
                            ? "bg-[#0B392B] text-white shadow-xs"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditional Delivery Address */}
                {orderType === "delivery" && (
                  <div>
                    <label className="block text-xs font-extrabold text-gray-700 mb-1">
                      Delivery Address *
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Enter full delivery address..."
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#0B392B]"
                    />
                  </div>
                )}

                {/* Conditional Pickup Timing */}
                {orderType === "pickup" && (
                  <div>
                    <label className="block text-xs font-extrabold text-gray-700 mb-1">
                      Pickup Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={pickupTiming}
                      onChange={(e) => setPickupTiming(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#0B392B]"
                    />
                  </div>
                )}

                {/* Mobile Number Input with Auto-Complete */}
                <div className="relative" ref={phoneContainerRef}>
                  <label className="block text-xs font-extrabold text-gray-700 mb-1">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="Enter 10-digit mobile number"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="w-full pl-10 pr-8 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#0B392B]"
                    />
                    {isSearchingPhone && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                      </span>
                    )}
                  </div>

                  {/* Suggestions Dropdown */}
                  {showPhoneSuggestions && searchedUsers.length > 0 && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-40 overflow-y-auto p-1">
                      {searchedUsers.map((user) => (
                        <div
                          key={user._id}
                          onClick={() => handleSelectSuggestedUser(user)}
                          className="p-2.5 hover:bg-emerald-50 rounded-xl cursor-pointer transition-colors flex items-center justify-between text-xs"
                        >
                          <span className="font-extrabold text-gray-800">{user.name}</span>
                          <span className="text-gray-400 font-mono text-[11px]">{user.phone}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Guest Name Input */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 mb-1">
                    Guest Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Enter guest full name"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#0B392B]"
                    />
                  </div>
                </div>

                {/* Order Notes */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 mb-1">
                    Order Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Special instructions or table number..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#0B392B]"
                  />
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 3. Sticky Action Bar at Bottom (Positioned right above AdminBottomNav) */}
      <div className="fixed bottom-16 left-0 right-0 z-30 bg-[#0B251C] text-white p-3.5 sm:px-6 shadow-2xl border-t border-emerald-400/20">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-emerald-200/80 block">
              {totalItemCount} {totalItemCount === 1 ? "Item" : "Items"} Selected
            </span>
            <span className="text-base font-extrabold text-white">₹{finalTotalAmount}</span>
          </div>

          {step === 1 ? (
            <div className="flex items-center gap-2">
              {totalItemCount > 0 && (
                <button
                  type="button"
                  onClick={() => setCart({})}
                  className="px-3 py-2 text-xs font-bold text-red-300 hover:text-red-100 hover:bg-white/10 rounded-xl cursor-pointer transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleContinueToStep2}
                disabled={totalItemCount === 0}
                className="bg-emerald-500 hover:bg-emerald-400 text-[#0B251C] font-extrabold text-xs px-4 py-2 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3.5 py-2 text-xs font-extrabold text-gray-300 hover:bg-white/10 rounded-xl cursor-pointer transition-colors"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={isSubmitting || totalItemCount === 0}
                className="bg-emerald-500 hover:bg-emerald-400 text-[#0B251C] font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Submit Order</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {orderSuccess && (
        <div className="fixed bottom-28 left-4 right-4 z-50 p-3.5 bg-[#0B392B] text-white rounded-2xl shadow-2xl flex items-center justify-between gap-3 border border-emerald-400/30 max-w-md mx-auto">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-extrabold">
              Order Created! (#{orderSuccessNumber})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOrderSuccess(false)}
            className="text-xs font-extrabold bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-xl cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

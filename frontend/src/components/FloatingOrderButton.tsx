"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  Plus,
  Minus,
  X,
  Search,
  Check,
  ChevronRight,
  User,
  Phone,
  FileText,
  Loader2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import {
  getCompactMenuItems,
  searchUserByPhone,
  createOrder,
  CompactMenuItem,
  SearchedUser,
  CreateOrderPayload,
} from "@/services/orderService";

export default function FloatingOrderButton() {
  const pathname = usePathname();

  // Floating Modal States
  const [isItemsModalOpen, setIsItemsModalOpen] = useState<boolean>(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);
  const [orderSuccessNumber, setOrderSuccessNumber] = useState<string>("");

  // Data & Pagination States
  const [items, setItems] = useState<CompactMenuItem[]>([]);
  const [loadingItems, setLoadingItems] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const gridScrollRef = useRef<HTMLDivElement | null>(null);

  // Cart State: { [menuItemId]: { item: CompactMenuItem, quantity: number } }
  const [cart, setCart] = useState<Record<string, { item: CompactMenuItem; quantity: number }>>({});

  // Checkout Form State
  const [guestPhone, setGuestPhone] = useState<string>("");
  const [guestName, setGuestName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Phone Search Auto-Complete State
  const [searchedUsers, setSearchedUsers] = useState<SearchedUser[]>([]);
  const [isSearchingPhone, setIsSearchingPhone] = useState<boolean>(false);
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const phoneContainerRef = useRef<HTMLDivElement | null>(null);
  const skipNextPhoneSearch = useRef<boolean>(false);

  // Fetch Items Page
  const fetchItemsPage = async (pageNum: number, searchStr: string, isAppend = false) => {
    if (isAppend) {
      setLoadingMore(true);
    } else {
      setLoadingItems(true);
    }

    try {
      const res = await getCompactMenuItems({ search: searchStr, page: pageNum, limit: 12 });
      if (isAppend) {
        setItems((prev) => [...prev, ...res.items]);
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

  // Open Items Selection Modal
  const handleOpenItemsModal = () => {
    setIsItemsModalOpen(true);
    setSearchTerm("");
    setPage(1);
    fetchItemsPage(1, "", false);
  };
  // Auto-dismiss success toast after 4 seconds
  useEffect(() => {
    if (!orderSuccess) return;
    const timer = setTimeout(() => setOrderSuccess(false), 4000);
    return () => clearTimeout(timer);
  }, [orderSuccess]);

  // Debounced Search Effect
  useEffect(() => {
    if (!isItemsModalOpen) return;
    const timer = setTimeout(() => {
      fetchItemsPage(1, searchTerm, false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, isItemsModalOpen]);

  // Infinite Scroll Handler
  const handleGridScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (
      scrollHeight - scrollTop - clientHeight < 30 &&
      hasNextPage &&
      !loadingMore &&
      !loadingItems
    ) {
      fetchItemsPage(page + 1, searchTerm, true);
    }
  };

  // Cart Handlers
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

  // Cart Calculations
  const cartEntries = Object.values(cart);
  const totalItemCount = cartEntries.reduce((sum, entry) => sum + entry.quantity, 0);
  const totalPrice = cartEntries.reduce(
    (sum, entry) => sum + entry.item.price * entry.quantity,
    0
  );

  // Handle Phone Number Input & Auto-Search
  useEffect(() => {
    if (skipNextPhoneSearch.current) {
      skipNextPhoneSearch.current = false;
      return;
    }

    // Clear selected user when phone is manually changed
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

  // Continue to Checkout Modal
  const handleContinueToCheckout = () => {
    if (totalItemCount === 0) return;
    setIsItemsModalOpen(false);
    setIsCheckoutModalOpen(true);
  };

  // Submit Order Handler
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!guestPhone.trim()) {
      setFormError("Guest mobile number is required.");
      return;
    }
    if (!selectedUserId && !guestName.trim()) {
      setFormError("Guest name is required.");
      return;
    }
    if (totalItemCount === 0) {
      setFormError("Please select at least one item.");
      return;
    }

    const payload: CreateOrderPayload = {
      ...(selectedUserId
        ? { userId: selectedUserId }
        : {
            guest: {
              name: guestName.trim(),
              phone: guestPhone.trim(),
            },
          }),
      items: cartEntries.map((entry) => ({
        menuItem: entry.item._id,
        name: entry.item.name,
        price: entry.item.price,
        quantity: entry.quantity,
      })),
      notes: notes.trim(),
    };

    setIsSubmitting(true);
    try {
      const createdOrder = await createOrder(payload);
      setOrderSuccessNumber(createdOrder.orderNumber || "ORD-SUCCESS");
      setOrderSuccess(true);
      setIsCheckoutModalOpen(false);
      // Reset cart and fields
      setCart({});
      setGuestPhone("");
      setGuestName("");
      setNotes("");
      setSelectedUserId(null);
    } catch (err: any) {
      setFormError(err?.message || "Failed to create order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered menu items for Modal 1
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  // Only render on admin panel pages (excluding /admin/login)
  if (!pathname || !pathname.startsWith("/admin") || pathname === "/admin/login") {
    return null;
  }

  return (
    <>
      {/* Pinned Floating Order Button (Bottom Right) */}
      <button
        onClick={handleOpenItemsModal}
        className="fixed bottom-20 sm:bottom-6 right-5 sm:right-6 z-40 bg-[#0B392B] hover:bg-[#07281E] text-white font-extrabold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 cursor-pointer transition-all hover:scale-105 active:scale-95 group border border-emerald-700/40"
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5 group-hover:rotate-6 transition-transform" />
          {totalItemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
              {totalItemCount}
            </span>
          )}
        </div>
        <span className="text-xs sm:text-sm tracking-wide">Order</span>
      </button>

      {/* MODAL 1: Select Items Modal */}
      {isItemsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-4 sm:p-6 shadow-2xl flex flex-col gap-3.5 h-[580px] max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-lg sm:text-lg font-extrabold text-[#0B251C]">
                  Create Quick Order
                </h2>
                <p className="text-[11px] text-gray-400">
                  Tap items to add them to your cart
                </p>
              </div>
              <button
                onClick={() => setIsItemsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B392B]"
              />
            </div>

            {/* Items Grid Container */}
            <div
              ref={gridScrollRef}
              onScroll={handleGridScroll}
              className="flex-1 overflow-y-auto pr-1"
            >
              {loadingItems ? (
                <div className="py-16 flex flex-col items-center justify-center text-gray-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#0B392B]" />
                  <span className="text-xs font-medium">Loading menu items...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-xs italic">
                  No menu items found.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {items.map((item) => {
                      const quantity = cart[item._id]?.quantity || 0;
                      const isSelected = quantity > 0;

                      return (
                        <div
                          key={item._id}
                          onClick={() => handleAddToCart(item)}
                          className={`relative rounded-xl overflow-hidden aspect-square cursor-pointer group transition-all transform active:scale-95 border-2 ${isSelected
                            ? "border-[#0B392B] ring-2 ring-emerald-500/30 shadow-md"
                            : "border-transparent hover:shadow-md"
                            }`}
                        >
                          {/* Background Image */}
                          <img
                            src={
                              item.image ||
                              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80"
                            }
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />

                          {/* Dark Gradient Overlay for Name */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-1.5">
                            <h4 className="text-white text-[10px] font-bold leading-tight drop-shadow-sm truncate" title={item.name}>
                              {item.name}
                            </h4>
                            <span className="text-emerald-300 text-[10px] font-extrabold">
                              ₹{item.price}
                            </span>
                          </div>

                          {/* Selected Quantity Counter Badge */}
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-[#0B392B] text-white text-[12px] font-extrabold px-1.5 py-0.5 rounded-full shadow-lg border border-emerald-400/40">
                              {quantity}x
                            </div>
                          )}

                          {/* Quantity Controls Overlay when selected */}
                          {isSelected && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute top-1 left-1 z-10"
                            >
                              <button
                                type="button"
                                title="Decrease quantity"
                                onClick={() => handleDecrementCart(item._id)}
                                className="w-6.5 h-6.5 bg-red-600/90 hover:bg-red-600 active:scale-90 text-white rounded-lg flex items-center justify-center cursor-pointer shadow-xl transition-all border border-white/20"
                              >
                                <Minus className="w-5 h-5 stroke-[3]" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {loadingMore && (
                    <div className="py-3 flex items-center justify-center gap-2 text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin text-[#0B392B]" />
                      <span className="text-[11px] font-medium">Loading more items...</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal 1 Footer */}
            <div className="border-t border-gray-100 pt-3 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-gray-500 block">
                  {totalItemCount} {totalItemCount === 1 ? "Item" : "Items"} Selected
                </span>
                <span className="text-base font-extrabold text-[#0B392B]">
                  ₹{totalPrice}
                </span>
              </div>
              <button
                type="button"
                onClick={handleContinueToCheckout}
                disabled={totalItemCount === 0}
                className="bg-[#0B392B] hover:bg-[#07281E] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Checkout & Guest Details Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#0B251C]">
                  Order Checkout
                </h2>
                <p className="text-[11px] text-gray-400">
                  Enter guest details to place the order
                </p>
              </div>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl font-medium">
                {formError}
              </div>
            )}

            {/* Selected Items Review */}
            <div>
              <h4 className="text-xs font-bold text-gray-700 mb-2">Order Items</h4>
              <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                {cartEntries.map(({ item, quantity }) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-100 text-xs"
                  >
                    <span className="font-extrabold text-gray-800 truncate max-w-[180px]">
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
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                <span className="text-xs font-extrabold text-gray-800">Total Amount</span>
                <span className="text-base font-extrabold text-[#0B392B]">₹{totalPrice}</span>
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmitOrder} className="flex flex-col gap-3">
              {/* Phone Input with Auto-Search */}
              <div className="relative" ref={phoneContainerRef}>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="Enter 10-digit mobile number"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B392B]"
                  />
                  {isSearchingPhone && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                    </span>
                  )}
                </div>

                {/* Search Suggestions Dropdown */}
                {showPhoneSuggestions && searchedUsers.length > 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-40 overflow-y-auto p-1">
                    {searchedUsers.map((user) => (
                      <div
                        key={user._id}
                        onClick={() => handleSelectSuggestedUser(user)}
                        className="p-2 hover:bg-emerald-50 rounded-xl cursor-pointer transition-colors flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-gray-800">{user.name}</span>
                        <span className="text-gray-400 font-mono text-[11px]">
                          {user.phone}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Guest Name Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Guest Name *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Enter guest full name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B392B]"
                  />
                </div>
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Order Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Special instructions or table number..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B392B]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCheckoutModalOpen(false);
                    setIsItemsModalOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#0B392B] hover:bg-[#07281E] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Created Success Banner */}
      {orderSuccess && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 sm:flex sm:justify-center">
          <div className="bg-[#0B392B] text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400/30 w-full sm:max-w-md">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-extrabold text-sm block">Order Created Successfully!</span>
              <span className="text-emerald-200 text-xs">Order No: {orderSuccessNumber}</span>
            </div>
            <button
              onClick={() => setOrderSuccess(false)}
              className="text-emerald-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

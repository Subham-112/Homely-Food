"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2,
  Info,
  ArrowRight,
  Tag,
  Check,
  X,
  ShoppingBag,
  Loader2,
  CheckCircle2,
  Sparkles,
  Utensils,
  MapPin,
  Clock,
} from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import QuantitySelector from "@/components/QuantitySelector";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { getOffers, Offer } from "@/services/offerService";

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    cart,
    isCartLoading,
    removeFromCart,
    updateQuantity,
    totalItems,
    totalAmount,
    appliedOffer,
    discountAmount,
    finalAmount,
    applyOffer,
    removeOffer,
    placeOrder,
  } = useCart();

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [orderType, setOrderType] = useState<"dine-in" | "delivery" | "pickup">("dine-in");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [pickupTiming, setPickupTiming] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Button submitting state & Success Modal state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrderSuccess, setPlacedOrderSuccess] = useState<{
    orderNumber: string;
    totalAmount: number;
    itemCount: number;
    orderType: string;
  } | null>(null);

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [couponFeedback, setCouponFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [availableOffers, setAvailableOffers] = useState<Offer[]>([]);

  // Pre-fill user details if logged in
  useEffect(() => {
    if (user) {
      if (user.name && !guestName) setGuestName(user.name);
      if (user.phone && !guestPhone) setGuestPhone(user.phone);
    }
  }, [user]);

  // Fetch active offers for coupon selection
  useEffect(() => {
    const fetchActiveOffers = async () => {
      try {
        const offers = await getOffers({ type: "active" });
        setAvailableOffers(offers);
      } catch (err) {
        console.error("Failed to load active offers for cart:", err);
      }
    };
    fetchActiveOffers();
  }, []);

  const handleApplyCoupon = (codeToApply?: string) => {
    setCouponFeedback(null);
    const code = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!code) {
      setCouponFeedback({ success: false, message: "Please enter a valid coupon code." });
      return;
    }

    const matchedOffer = availableOffers.find(
      (o) => o.code.toUpperCase() === code
    );

    if (!matchedOffer) {
      setCouponFeedback({ success: false, message: `Coupon code "${code}" is invalid or expired.` });
      return;
    }

    const result = applyOffer(matchedOffer);
    setCouponFeedback(result);
    if (result.success) {
      setCouponCodeInput("");
    }
  };

  const handlePlaceOrder = async () => {
    setFormError(null);
    if (!guestPhone.trim()) {
      setFormError("Mobile number is required.");
      return;
    }
    if (!guestName.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (orderType === "delivery" && (!deliveryAddress || !deliveryAddress.trim())) {
      setFormError("Delivery address is required for delivery orders.");
      return;
    }
    if (orderType === "pickup" && (!pickupTiming || !pickupTiming.trim())) {
      setFormError("Pickup date & time are required for pickup orders.");
      return;
    }

    setIsSubmitting(true);
    try {
      const createdOrder = await placeOrder(guestName, guestPhone, {
        orderType,
        deliveryAddress: orderType === "delivery" ? deliveryAddress : undefined,
        pickupTiming: orderType === "pickup" ? new Date(pickupTiming).toISOString() : undefined,
      });

      // Show Animated Success Modal
      setPlacedOrderSuccess({
        orderNumber: createdOrder?.orderNumber || "OD-" + Math.floor(100000 + Math.random() * 900000),
        totalAmount: finalAmount,
        itemCount: totalItems,
        orderType: orderType === "dine-in" ? "Normal / Dine-in" : orderType,
      });
    } catch (err: any) {
      setFormError(err?.message || "Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#FAF6ED] relative">
      {/* Fixed Top Header */}
      <Header />

      {/* Middle Scrollable Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 sm:p-5 max-w-4xl w-full mx-auto flex flex-col gap-2 pb-24">
        {/* Page Title */}
        <div className="flex items-center justify-between px-0.5">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B251C] font-poppins">
            My Cart
          </h1>
          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#0B392B]/10 text-[#0B392B]">
            {totalItems} {totalItems === 1 ? "Item" : "Items"}
          </span>
        </div>

        {/* Cart Loader or Empty Cart State */}
        {isCartLoading ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-[#E8E1D3] flex flex-col items-center justify-center gap-3 shadow-xs my-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#0B392B]" />
            <span className="text-xs font-semibold text-gray-500">Loading your cart...</span>
          </div>
        ) : cart.length === 0 && !placedOrderSuccess ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#E8E1D3] flex flex-col items-center justify-center gap-4 shadow-xs my-4">
            <div className="w-16 h-16 rounded-full bg-[#FAF6ED] flex items-center justify-center text-[#0B392B]">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0B251C]">Your cart is currently empty</h2>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                Explore our menu to add fresh, delicious homestyle food to your cart!
              </p>
            </div>
            <Button
              variant="primary"
              fullWidth={false}
              onClick={() => router.push("/")}
            >
              Browse Menu
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
            {/* Left Column: Unified Cart Items Box & Coupons */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              {/* Single Unified Container Card for ALL Cart Items */}
              <div className="bg-white rounded-2xl p-4 pb-0 border border-[#E8E1D3] shadow-xs flex flex-col">
                <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">
                  Cart Items
                </h2>

                {cart.map(({ item, quantity }, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between py-3 ${
                      index !== cart.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                  >
                    {/* Left: Item Name ONLY */}
                    <div className="flex items-center flex-1 min-w-0 pr-3">
                      <span className="font-extrabold text-sm sm:text-base text-[#0B251C] font-poppins truncate">
                        {item.name}
                      </span>
                    </div>

                    {/* Right: Quantity Selector & Delete Icon ONLY */}
                    <div className="flex items-center gap-3 shrink-0">
                      <QuantitySelector
                        quantity={quantity}
                        onIncrease={() => updateQuantity(item.id, 1)}
                        onDecrease={() => updateQuantity(item.id, -1)}
                        size="sm"
                      />
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        aria-label="Delete item"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupons & Offers Box */}
              <div className="bg-white rounded-2xl p-4 border border-[#E8E1D3] shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#0B251C] flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-[#0B392B]" /> Coupons & Offers
                  </h2>
                </div>

                {appliedOffer ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#0B392B] text-white flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-mono text-xs font-extrabold text-[#0B392B] uppercase block">
                          {appliedOffer.code} Applied
                        </span>
                        <span className="text-[11px] text-emerald-700 font-semibold block">
                          Saving ₹{discountAmount} on this order!
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeOffer}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Remove coupon"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="ENTER COUPON CODE (E.G. SAVE10)"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0B251C] uppercase placeholder:text-gray-400 focus:outline-none focus:border-[#0B392B]"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
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
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                          Available Coupons
                        </span>
                        <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto no-scrollbar">
                          {availableOffers.map((off) => (
                            <div
                              key={off._id}
                              className="flex items-center justify-between bg-[#F8FAFC] border border-gray-100 p-2.5 rounded-xl text-xs"
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
                                onClick={() => handleApplyCoupon(off.code)}
                                className="text-[11px] font-extrabold text-[#0B392B] hover:underline cursor-pointer px-2 py-1"
                              >
                                APPLY
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Summary & Checkout Form */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              {/* Order Summary Box */}
              <div className="bg-white rounded-2xl p-5 border border-[#E8E1D3] shadow-xs flex flex-col gap-3">
                <h2 className="text-base font-bold text-[#0B251C]">Order Summary</h2>

                <div className="flex flex-col gap-2 text-xs sm:text-sm border-b border-gray-100 pb-3">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Items Total</span>
                    <span className="font-semibold text-gray-800">₹{totalAmount}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-emerald-700 font-bold">
                      <span>Coupon Discount</span>
                      <span>-₹{discountAmount}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Delivery / Service</span>
                    <span className="font-semibold text-gray-800">₹0</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-base font-bold text-[#0B251C]">
                  <span>Total Amount</span>
                  <span className="text-xl font-extrabold text-[#0B392B]">₹{finalAmount}</span>
                </div>

                {/* Info Banner */}
                <div className="bg-[#EBF5FC] rounded-xl p-3 flex items-center gap-2.5 text-xs text-[#0B392B] border border-[#D4E8F8]">
                  <Info className="w-4 h-4 shrink-0" />
                  <span className="font-medium">Note: Payment: Offline / Cash</span>
                </div>
              </div>

              {/* Checkout Form Box */}
              <div className="bg-white rounded-2xl p-5 border border-[#E8E1D3] shadow-xs flex flex-col gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#0B251C]">
                    {user ? "Customer Details" : "Checkout as Guest"}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {user ? "Logged in profile attached to order." : "No account required to place your order."}
                  </p>
                </div>

                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl font-semibold">
                    {formError}
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-700">Order Type *</span>
                  <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
                    {(["dine-in", "delivery", "pickup"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setOrderType(type)}
                        className={`py-1.5 rounded-lg text-center cursor-pointer transition-all capitalize ${
                          orderType === type
                            ? "bg-[#0B392B] text-white shadow-xs"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {type === "dine-in" ? "normally" : type}
                      </button>
                    ))}
                  </div>
                </div>

                {orderType === "delivery" && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-gray-700">Delivery Address *</span>
                    <textarea
                      required
                      rows={2}
                      placeholder="Enter full delivery address details..."
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B392B]"
                    />
                  </div>
                )}

                {orderType === "pickup" && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-gray-700">Pickup Date & Time *</span>
                    <input
                      type="datetime-local"
                      required
                      value={pickupTiming}
                      onChange={(e) => setPickupTiming(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B392B]"
                    />
                  </div>
                )}

                <Input
                  label="Name *"
                  placeholder="Enter your full name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />

                <Input
                  label="Mobile Number *"
                  type="tel"
                  placeholder="+91 10-digit mobile number"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                />

                {cart.length > 0 && (
                  <div className="mt-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handlePlaceOrder}
                      className="w-full bg-[#C51E1E] hover:bg-[#A31818] text-white font-extrabold text-sm py-3.5 px-4 rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4.5 h-4.5 animate-spin text-white" />
                          <span>PLACING ORDER...</span>
                        </>
                      ) : (
                        <>
                          <span>PLACE ORDER (₹{finalAmount})</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Animated Order Success Modal */}
      {placedOrderSuccess && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center flex flex-col items-center gap-4 shadow-2xl animate-in fade-in zoom-in-95 duration-300 border border-[#E8E1D3] relative overflow-hidden">
            {/* Top Glowing Pulse & Scale-in Checkmark Badge */}
            <div className="relative flex items-center justify-center mt-2">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner animate-bounce">
                <CheckCircle2 className="w-12 h-12 text-[#0B392B]" />
              </div>
              <Sparkles className="w-6 h-6 text-[#FFCC00] absolute -top-1 -right-1 animate-pulse" />
            </div>

            {/* Title & Headline */}
            <div>
              <h2 className="text-xl font-extrabold text-[#0B251C] font-poppins">
                Order Placed Successfully! 🎉
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                Thank you! Your homestyle food order has been confirmed by our kitchen.
              </p>
            </div>

            {/* Order Details Card */}
            <div className="w-full bg-[#FAF6ED] rounded-2xl p-4 border border-[#E8E1D3] flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200/70">
                <span className="text-gray-500 font-semibold">Order Number</span>
                <span className="font-mono font-extrabold text-[#0B392B] bg-emerald-100/70 px-2 py-0.5 rounded-lg border border-emerald-200">
                  #{placedOrderSuccess.orderNumber}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 text-gray-600">
                <span>Order Type</span>
                <span className="font-bold text-[#0B251C] capitalize">
                  {placedOrderSuccess.orderType}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 text-gray-600">
                <span>Items Ordered</span>
                <span className="font-bold text-[#0B251C]">
                  {placedOrderSuccess.itemCount} {placedOrderSuccess.itemCount === 1 ? "Item" : "Items"}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200/70 font-extrabold text-sm text-[#0B251C]">
                <span>Total Amount Paid</span>
                <span className="text-[#0B392B]">₹{placedOrderSuccess.totalAmount}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-2 pt-1">
              <button
                onClick={() => {
                  router.push(`/order-tracking?orderId=${placedOrderSuccess.orderNumber}`);
                }}
                className="w-full bg-[#0B392B] hover:bg-[#07281E] text-white font-extrabold text-xs sm:text-sm py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Utensils className="w-4 h-4 text-[#FFCC00]" />
                <span>Track Order Real-Time</span>
              </button>

              <button
                onClick={() => {
                  setPlacedOrderSuccess(null);
                  router.push("/");
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs sm:text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Back to Home Menu</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation for Mobile */}
      <BottomNav />
    </div>
  );
}

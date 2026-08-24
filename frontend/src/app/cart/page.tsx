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
  CreditCard,
  Coins,
  RotateCcw,
} from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import QuantitySelector from "@/components/QuantitySelector";
import Input from "@/components/Input";
import Button from "@/components/Button";
import RazorpayCheckoutButton from "@/components/RazorpayCheckoutButton";
import { openRazorpaySDK } from "@/utils/razorpayHelper";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useCoins } from "@/context/CoinContext";
import { getOffers, Offer } from "@/services/offerService";
import { getShopDetails } from "@/services/shopDetailsService";

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { refreshWallet } = useCoins();
  const {
    cart,
    cartId,
    isCartLoading,
    removeFromCart,
    updateQuantity,
    totalItems,
    subTotal,
    discountAmount,
    finalAmount,
    appliedOfferCode,
    discountType,
    coinsUsed,
    applyCoupon,
    removeCoupon,
    coinDeductionInfo,
    isLoadingDeduction,
    applyCoins,
    removeCoins,
    placeOrder,
    refreshCart,
  } = useCart();

  const [paymentPreference, setPaymentPreference] = useState<"CASH" | "ONLINE">("CASH");
  const [onlineCheckoutSession, setOnlineCheckoutSession] = useState<any>(null);

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

  // Rewards & Offers Tab State: "coins" | "offers"
  const [activeOfferTab, setActiveOfferTab] = useState<"coins" | "offers">("coins");
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [couponFeedback, setCouponFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [availableOffers, setAvailableOffers] = useState<Offer[]>([]);

  // Coin Confirmation Modal State
  const [showCoinConfirmModal, setShowCoinConfirmModal] = useState(false);
  const [isApplyingCoins, setIsApplyingCoins] = useState(false);
  const [coinFeedback, setCoinFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Pre-fill user details if logged in
  useEffect(() => {
    if (user) {
      if (user.name && !guestName) setGuestName(user.name);
      if (user.phone && !guestPhone) setGuestPhone(user.phone);
    }
  }, [user]);

  // Derive regular cart items vs re-ordered items
  const regularCartItems = cart.filter((c) => !c.isReorder);
  const reorderedCartItems = cart.filter((c) => Boolean(c.isReorder));
  const hasMixedCartItems = regularCartItems.length > 0 && reorderedCartItems.length > 0;

  // Checkout Scope Modal State
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [selectedCheckoutScope, setSelectedCheckoutScope] = useState<"all" | "cart_only" | "reorder_only">("all");
  const [keepRemainingItems, setKeepRemainingItems] = useState(true);

  // Coin deduction calculation is triggered automatically inside CartContext after backend sync succeeds

  // Active Offers Fetching: Fetch ONCE when user opens cart page and cart has items
  const offersFetchedRef = React.useRef(false);

  useEffect(() => {
    if (!cart || cart.length === 0) {
      setAvailableOffers([]);
      offersFetchedRef.current = false;
      return;
    }

    if (offersFetchedRef.current) return;

    const fetchActiveOffers = async () => {
      try {
        const offers = await getOffers({ type: "active" });
        setAvailableOffers(offers);
        offersFetchedRef.current = true;
      } catch (err) {
        console.error("Failed to load active offers for cart:", err);
      }
    };

    fetchActiveOffers();
  }, [cart.length]);

  const handleConfirmApplyCoins = async () => {
    setShowCoinConfirmModal(false);
    setIsApplyingCoins(true);
    setCoinFeedback(null);
    try {
      const res = await applyCoins();
      setCoinFeedback(res);
    } catch (err: any) {
      setCoinFeedback({ success: false, message: err?.message || "Failed to redeem coins." });
    } finally {
      setIsApplyingCoins(false);
    }
  };

  const handleApplyCoupon = async (codeToApply?: string) => {
    setCouponFeedback(null);
    const code = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!code) {
      setCouponFeedback({ success: false, message: "Please enter a valid coupon code." });
      return;
    }

    const result = await applyCoupon(code);
    setCouponFeedback(result);
    if (result.success) {
      setCouponCodeInput("");
    }
  };

  const [deliveryPincode, setDeliveryPincode] = useState("");
  const [serviceablePincodes, setServiceablePincodes] = useState<string[]>([]);

  // Fetch Serviceable Pincodes from ShopDetails API
  useEffect(() => {
    const fetchPincodes = async () => {
      try {
        const details = await getShopDetails();
        if (details && details.serviceablePincodes) {
          setServiceablePincodes(details.serviceablePincodes);
        }
      } catch (err) {
        console.error("Failed to load serviceable pincodes for cart:", err);
      }
    };
    fetchPincodes();
  }, []);

  const handlePlaceOrder = async (forceShowModal: boolean = false) => {
    setFormError(null);
    if (!guestPhone.trim()) {
      setFormError("Mobile number is required.");
      return;
    }
    if (!guestName.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (orderType === "delivery") {
      if (!deliveryPincode) {
        setFormError("Delivery pincode is required. Please select your pincode.");
        return;
      }
      if (!deliveryAddress || !deliveryAddress.trim()) {
        setFormError("Delivery address is required for delivery orders.");
        return;
      }
    }
    if (orderType === "pickup" && (!pickupTiming || !pickupTiming.trim())) {
      setFormError("Pickup date & time are required for pickup orders.");
      return;
    }

    // If cart contains both regular items AND re-ordered items, ALWAYS prompt scope modal!
    if (hasMixedCartItems && (forceShowModal || !showScopeModal)) {
      setShowScopeModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedDeliveryAddress =
        orderType === "delivery"
          ? `${deliveryAddress.trim()} (Pincode: ${deliveryPincode})`
          : undefined;

      const result = await placeOrder(guestName, guestPhone, {
        orderType,
        deliveryAddress: formattedDeliveryAddress,
        pickupTiming: orderType === "pickup" ? new Date(pickupTiming).toISOString() : undefined,
        paymentPreference,
        checkoutScope: selectedCheckoutScope,
        keepRemaining: keepRemainingItems,
      });

      if (paymentPreference === "ONLINE" && result?.requiresPayment) {
        setIsSubmitting(true);
        await openRazorpaySDK(
          result,
          async (createdOrder) => {
            setIsSubmitting(false);
            try {
              await Promise.all([refreshCart(), refreshWallet()]);
            } catch (rErr) {
              console.error("Failed to refresh cart/wallet after payment:", rErr);
            }
            setPlacedOrderSuccess({
              orderNumber: createdOrder?.orderNumber || "OD-" + Math.floor(100000 + Math.random() * 900000),
              totalAmount: createdOrder?.payment?.totalAmount ?? createdOrder?.totalAmount ?? finalAmount,
              itemCount: totalItems,
              orderType: orderType === "dine-in" ? "Normal / Dine-in" : orderType,
            });
          },
          (err) => {
            setIsSubmitting(false);
            setFormError(err?.message || "Payment cancelled or failed.");
          },
          () => {
            // User closed/dismissed Razorpay window without completing payment
            setIsSubmitting(false);
          }
        );
        return;
      }

      const createdOrder = result;

      // Refresh Header Coin balance for Offline / Cash orders
      try {
        await refreshWallet();
      } catch (wErr) {
        console.error("Failed to refresh coin wallet after cash order placement:", wErr);
      }

      // Show Animated Success Modal
      setPlacedOrderSuccess({
        orderNumber: createdOrder?.orderNumber || "OD-" + Math.floor(100000 + Math.random() * 900000),
        totalAmount: createdOrder?.payment?.totalAmount ?? createdOrder?.totalAmount ?? finalAmount,
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
              {/* Regular Cart Items Container */}
              {regularCartItems.length > 0 && (
                <div className="bg-white rounded-2xl p-4 pb-0 border border-[#E8E1D3] shadow-xs flex flex-col">
                  <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center justify-between">
                    <span>Cart Items</span>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                      {regularCartItems.length} {regularCartItems.length === 1 ? "item" : "items"}
                    </span>
                  </h2>

                  {regularCartItems.map(({ item, quantity, variant }, index) => (
                    <div
                      key={`${item.id}_${variant?.id || ""}`}
                      className={`flex items-center justify-between py-2 ${
                        index !== regularCartItems.length - 1 ? "border-b border-gray-100" : ""
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
                          onIncrease={() => updateQuantity(item.id, 1, variant?.id)}
                          onDecrease={() => updateQuantity(item.id, -1, variant?.id)}
                          size="sm"
                        />
                        <button
                          onClick={() => removeFromCart(item.id, variant?.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          aria-label="Delete item"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Re-ordered Items Container */}
              {reorderedCartItems.length > 0 && (
                <div className="bg-white rounded-2xl p-4 pb-0 border border-[#0B392B]/30 bg-emerald-50/20 shadow-xs flex flex-col">
                  <h2 className="text-xs font-extrabold text-[#0B392B] uppercase tracking-wider border-b border-emerald-100/60 pb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5" /> Re-ordered Items
                    </span>
                    <span className="text-[10px] font-extrabold bg-[#0B392B]/10 text-[#0B392B] px-2 py-0.5 rounded-md">
                      {reorderedCartItems.length} {reorderedCartItems.length === 1 ? "item" : "items"}
                    </span>
                  </h2>

                  {reorderedCartItems.map(({ item, quantity, variant }, index) => (
                    <div
                      key={`${item.id}_${variant?.id || ""}`}
                      className={`flex items-center justify-between py-2 ${
                        index !== reorderedCartItems.length - 1 ? "border-b border-emerald-100/40" : ""
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
                          onIncrease={() => updateQuantity(item.id, 1, variant?.id)}
                          onDecrease={() => updateQuantity(item.id, -1, variant?.id)}
                          size="sm"
                        />
                        <button
                          onClick={() => removeFromCart(item.id, variant?.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          aria-label="Delete item"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Coupons & Offers Section with Coins | Offers Tabs */}
              <div className="bg-white rounded-2xl p-4 border border-[#E8E1D3] shadow-xs flex flex-col gap-3">
                {/* Header & Tabs */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <h2 className="text-sm font-bold text-[#0B251C] flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-[#0B392B]" /> Rewards & Offers
                  </h2>

                  {/* Tab Selector: Only show Offers tab if availableOffers.length > 0 */}
                  <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-xs font-extrabold">
                    <button
                      type="button"
                      onClick={() => setActiveOfferTab("coins")}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        activeOfferTab === "coins"
                          ? "bg-[#0B392B] text-white shadow-xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Coins
                    </button>
                    {availableOffers.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveOfferTab("offers")}
                        className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                          activeOfferTab === "offers"
                            ? "bg-[#0B392B] text-white shadow-xs"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Offers ({availableOffers.length})
                      </button>
                    )}
                  </div>
                </div>

                {/* TAB 1: Homely Coins Section */}
                {activeOfferTab === "coins" && (
                  <div className="flex flex-col gap-2.5">
                    {discountType === "coins" ? (
                      <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 font-extrabold text-sm shadow-xs">
                            🪙
                          </div>
                          <div>
                            <span className="font-extrabold text-xs text-amber-900 block">
                              Homely Coins Applied
                            </span>
                            <span className="text-[11px] text-amber-800 font-semibold block">
                              Saving ₹{discountAmount} using {coinsUsed || discountAmount} Coins!
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCoins()}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove coins"
                        >
                          <X className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="bg-[#FAF6ED] border border-[#E8E1D3] rounded-2xl p-3 sm:p-3.5 flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Coins className="w-4 h-4 text-amber-600 shrink-0" />
                              <span className="text-xs sm:text-sm font-extrabold text-[#0B251C]">
                                Redeem Homely Coins
                              </span>
                            </div>
                            <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium leading-snug">
                              Current Balance: <strong className="text-gray-800">{coinDeductionInfo?.userBalance ?? 0} Coins</strong>{" "}
                              <span className="block sm:inline text-gray-400 font-normal">(Redeem 50% of your coins)</span>
                            </span>
                          </div>

                          {/* Right Side: Column layout for Deducted Coin Badge and Use Button */}
                          <div className="flex flex-col items-end justify-center gap-1.5 shrink-0">
                            {isLoadingDeduction ? (
                              <div className="flex items-center justify-center p-2 bg-emerald-50/50 rounded-xl border border-emerald-100/50 min-w-[70px]">
                                <Loader2 className="w-4 h-4 animate-spin text-[#0B392B]" />
                              </div>
                            ) : coinDeductionInfo && coinDeductionInfo.deductedCoins > 0 ? (
                              <>
                                <span className="font-extrabold text-[11px] text-[#0B392B] bg-emerald-100/90 border border-emerald-200/80 px-2 py-0.5 rounded-lg whitespace-nowrap">
                                  -₹{coinDeductionInfo.deductedCoins} ({coinDeductionInfo.deductedCoins} Coins)
                                </span>
                                <button
                                  type="button"
                                  disabled={isApplyingCoins}
                                  onClick={() => setShowCoinConfirmModal(true)}
                                  className="w-full bg-[#0B392B] hover:bg-[#07281E] text-white font-extrabold text-xs py-1 px-3 rounded-lg shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer text-center flex items-center justify-center gap-1.5 disabled:opacity-75"
                                >
                                  {isApplyingCoins ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                  ) : (
                                    "Use"
                                  )}
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md whitespace-nowrap">
                                No coins available
                              </span>
                            )}
                          </div>
                        </div>

                        {coinFeedback && (
                          <div
                            className={`text-xs font-semibold px-3 py-2 rounded-xl border ${
                              coinFeedback.success
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }`}
                          >
                            {coinFeedback.message}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: Coupons & Offers Section */}
                {activeOfferTab === "offers" && availableOffers.length > 0 && (
                  <div className="flex flex-col gap-2.5">
                    {appliedOfferCode ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#0B392B] text-white flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-mono text-xs font-extrabold text-[#0B392B] uppercase block">
                              {appliedOfferCode} Applied
                            </span>
                            <span className="text-[11px] text-emerald-700 font-semibold block">
                              Saving ₹{discountAmount} on this order!
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removeCoupon}
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
                    <span className="font-semibold text-gray-800">₹{subTotal}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-emerald-700 font-bold">
                      <span>{discountType === "coins" ? "🪙 Coins Discount" : "Coupon Discount"}</span>
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
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {orderType === "delivery" && (
                  <>
                    <div className="flex flex-col gap-1 items-start">
                      <span className="text-xs font-bold text-gray-700">Delivery Pincode *</span>
                      <select
                        required
                        value={deliveryPincode}
                        onChange={(e) => setDeliveryPincode(e.target.value)}
                        className="w-full max-w-[220px] sm:max-w-[260px] px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B392B] bg-white font-mono font-bold cursor-pointer shadow-2xs"
                      >
                        <option value="">-- Select Pincode --</option>
                        {serviceablePincodes.map((code) => (
                          <option key={code} value={code}>
                            {code}
                          </option>
                        ))}
                      </select>
                    </div>

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
                  </>
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

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-700">Payment Method *</span>
                  <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setPaymentPreference("CASH")}
                      className={`py-2 rounded-lg text-center cursor-pointer transition-all ${
                        paymentPreference === "CASH"
                          ? "bg-[#0B392B] text-white shadow-xs"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Pay at Counter
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentPreference("ONLINE")}
                      className={`py-2 rounded-lg text-center cursor-pointer transition-all ${
                        paymentPreference === "ONLINE"
                          ? "bg-[#0B392B] text-white shadow-xs"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Pay Online
                    </button>
                  </div>
                </div>

                {cart.length > 0 && (
                  <div className="mt-2">
                    {onlineCheckoutSession ? (
                      <RazorpayCheckoutButton
                        checkoutSession={onlineCheckoutSession}
                        onSuccess={(createdOrder) => {
                          setOnlineCheckoutSession(null);
                          setPlacedOrderSuccess({
                            orderNumber: createdOrder?.orderNumber || "OD-" + Math.floor(100000 + Math.random() * 900000),
                            totalAmount: createdOrder?.totalAmount || finalAmount,
                            itemCount: totalItems,
                            orderType: orderType === "dine-in" ? "Normal / Dine-in" : orderType,
                          });
                        }}
                        onFailure={() => {
                          setOnlineCheckoutSession(null);
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handlePlaceOrder(true)}
                        className="w-full bg-[#C51E1E] hover:bg-[#A31818] text-white font-extrabold text-sm py-3.5 px-4 rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4.5 h-4.5 animate-spin text-white shrink-0" />
                            <span>{paymentPreference === "ONLINE" ? "PROCESSING PAYMENT..." : "PLACING ORDER..."}</span>
                          </>
                        ) : (
                          <>
                            <span>{paymentPreference === "ONLINE" ? `PROCEED TO PAY ONLINE (₹${finalAmount})` : `PLACE ORDER (₹${finalAmount})`}</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
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
                <span>Total Amount</span>
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

      {/* Confirmation Modal for Homely Coin Redemption */}
      {showCoinConfirmModal && coinDeductionInfo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl p-4 max-w-sm w-full shadow-2xl flex flex-col gap-4 border border-[#E8E1D3] relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🪙</span>
                <h3 className="text-base font-extrabold text-[#0B251C] font-poppins">
                  Confirm Coin Redemption
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCoinConfirmModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#FAF6ED] p-4 rounded-2xl border border-[#E8E1D3] flex flex-col gap-2 text-xs">
              <p className="text-gray-600 leading-relaxed font-medium">
                Are you sure you want to redeem{" "}
                <span className="font-extrabold text-[#0B392B] underline">
                  {coinDeductionInfo.deductedCoins} Homely Coins
                </span>{" "}
                (50% of your coin balance) for an instant discount of{" "}
                <span className="font-extrabold text-emerald-700">
                  ₹{coinDeductionInfo.deductedCoins}
                </span>{" "}
                on this cart order?
              </p>
              <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-500 font-bold">
                <span>Remaining Coin Balance:</span>
                <span className="text-gray-800">
                  {coinDeductionInfo.userBalance - coinDeductionInfo.deductedCoins} Coins
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowCoinConfirmModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isApplyingCoins}
                onClick={handleConfirmApplyCoins}
                className="flex-1 bg-[#0B392B] hover:bg-[#07281E] text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isApplyingCoins ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Confirm & Redeem</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scope Checkout Confirmation Modal */}
      {showScopeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl flex flex-col gap-4 border border-[#E8E1D3] relative animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#0B392B]" />
                <h3 className="text-base font-extrabold text-[#0B251C] font-poppins">
                  Select Items to Order
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowScopeModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 font-medium">
              Your cart has both regular items and re-ordered items. Choose which items you want to include in this order:
            </p>

            {/* Scope Radio Options */}
            <div className="flex flex-col gap-2">
              <label
                onClick={() => setSelectedCheckoutScope("all")}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedCheckoutScope === "all"
                    ? "bg-[#0B392B]/5 border-[#0B392B] shadow-2xs"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="checkoutScope"
                    checked={selectedCheckoutScope === "all"}
                    onChange={() => setSelectedCheckoutScope("all")}
                    className="w-4 h-4 accent-[#0B392B] cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-extrabold text-[#0B251C] block">
                      Order All Items ({cart.length})
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium">
                      Includes regular cart items & re-ordered items
                    </span>
                  </div>
                </div>
              </label>

              <label
                onClick={() => setSelectedCheckoutScope("cart_only")}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedCheckoutScope === "cart_only"
                    ? "bg-[#0B392B]/5 border-[#0B392B] shadow-2xs"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="checkoutScope"
                    checked={selectedCheckoutScope === "cart_only"}
                    onChange={() => setSelectedCheckoutScope("cart_only")}
                    className="w-4 h-4 accent-[#0B392B] cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-extrabold text-[#0B251C] block">
                      Order Only Cart Items ({regularCartItems.length})
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium">
                      Exclude re-ordered items from this checkout
                    </span>
                  </div>
                </div>
              </label>

              <label
                onClick={() => setSelectedCheckoutScope("reorder_only")}
                className={`p-3.5 py-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedCheckoutScope === "reorder_only"
                    ? "bg-[#0B392B]/5 border-[#0B392B] shadow-2xs"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="checkoutScope"
                    checked={selectedCheckoutScope === "reorder_only"}
                    onChange={() => setSelectedCheckoutScope("reorder_only")}
                    className="w-4 h-4 accent-[#0B392B] cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-extrabold text-[#0B251C] block">
                      Order Only Re-ordered Items ({reorderedCartItems.length})
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium">
                      Exclude regular cart items from this checkout
                    </span>
                  </div>
                </div>
              </label>
            </div>

            {/* Retention Checkbox / Notice */}
            {selectedCheckoutScope !== "all" && (
              <div className="bg-[#FAF6ED] p-3 rounded-xl border border-[#E8E1D3] flex flex-col gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keepRemainingItems}
                    onChange={(e) => setKeepRemainingItems(e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-[#0B392B] rounded-md cursor-pointer shrink-0"
                  />
                  <span className="text-[11px] text-gray-700 font-semibold leading-tight">
                    Keep un-selected items in my cart for later.
                  </span>
                </label>
                {!keepRemainingItems && (
                  <p className="text-[10px] text-amber-700 font-bold bg-amber-50 p-2 rounded-lg border border-amber-200/60">
                    ⚠️ Note: If unchecked, remaining items will be removed from your cart after ordering.
                  </p>
                )}
              </div>
            )}

            {/* Modal Buttons */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowScopeModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setShowScopeModal(false);
                  handlePlaceOrder();
                }}
                className="flex-1 bg-[#C51E1E] hover:bg-[#A31818] text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <span>PROCEED TO ORDER</span>
                )}
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

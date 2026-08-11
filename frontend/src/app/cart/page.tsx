"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Info, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import QuantitySelector from "@/components/QuantitySelector";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity, totalItems, totalAmount, placeOrder } =
    useCart();

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [orderType, setOrderType] = useState<"dine-in" | "delivery" | "pickup">("dine-in");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [pickupTiming, setPickupTiming] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

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

    try {
      await placeOrder(guestName, guestPhone, {
        orderType,
        deliveryAddress: orderType === "delivery" ? deliveryAddress : undefined,
        pickupTiming: orderType === "pickup" ? new Date(pickupTiming).toISOString() : undefined,
      });
      router.push("/order-tracking");
    } catch (err: any) {
      setFormError(err?.message || "Failed to place order. Please try again.");
    }
  };

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#FAF6ED] relative">
      {/* Fixed Top Header */}
      <Header />

      {/* Middle Scrollable Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-5 max-w-4xl w-full mx-auto flex flex-col gap-4 pb-20">
        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B251C] font-poppins">
          My Cart ({totalItems} {totalItems === 1 ? "Item" : "Items"})
        </h1>

        {/* Cart Layout Grid */}
        {cart.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 flex flex-col items-center justify-center gap-4 shadow-sm">
            <p className="text-gray-500 font-medium text-base">Your cart is currently empty.</p>
            <Button
              variant="primary"
              fullWidth={false}
              onClick={() => router.push("/")}
            >
              Browse Menu
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Cart Item Cards */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              {cart.map(({ item, quantity }) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex items-center gap-4"
                >
                  {/* Image */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info & Quantity */}
                  <div className="flex-1 flex flex-col justify-between min-h-20 py-0.5">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-[#0B251C] leading-snug">
                        {item.name}
                      </h3>
                      <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1">
                        ₹{item.price}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <QuantitySelector
                        quantity={quantity}
                        onIncrease={() => updateQuantity(item.id, 1)}
                        onDecrease={() => updateQuantity(item.id, -1)}
                        size="sm"
                      />

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-gray-400 hover:text-[#C51E1E] transition-colors cursor-pointer"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Order Summary & Checkout */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              {/* Order Summary Box */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs flex flex-col gap-3">
                <h2 className="text-base font-bold text-[#0B251C]">Order Summary</h2>

                <div className="flex flex-col gap-2.5 text-xs sm:text-sm border-b border-gray-100 pb-3">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Items Total</span>
                    <span className="font-semibold text-gray-800">₹{totalAmount}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Delivery/Service</span>
                    <span className="font-semibold text-gray-800">₹0</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-base font-bold text-[#0B251C]">
                  <span>Total Amount</span>
                  <span>₹{totalAmount}</span>
                </div>

                {/* Info Banner */}
                <div className="bg-[#EBF5FC] rounded-xl p-3 flex items-center gap-2.5 text-xs text-[#0B392B] border border-[#D4E8F8]">
                  <Info className="w-4 h-4 shrink-0" />
                  <span className="font-medium">Note: Payment: Offline / Cash</span>
                </div>
              </div>

              {/* Checkout as Guest Box */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs flex flex-col gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#0B251C]">Checkout as Guest</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    No account required to place your order.
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
                  label="Name"
                  placeholder="Enter your full name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />

                <Input
                  label="Mobile Number"
                  type="tel"
                  placeholder="+91 10-digit mobile number"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                />

                {cart.length > 0 && (
                  <div className="mt-2">
                    <Button
                      variant="red"
                      onClick={handlePlaceOrder}
                      icon={ArrowRight}
                      iconPosition="right"
                    >
                      PLACE ORDER (₹{totalAmount})
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation for Mobile */}
      <BottomNav />
    </div>
  );
}

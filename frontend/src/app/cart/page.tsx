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

  const handlePlaceOrder = () => {
    placeOrder(guestName, guestPhone);
    router.push("/order-tracking");
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#FAF6ED] relative">
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

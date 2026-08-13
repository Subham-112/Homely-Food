"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShoppingBag,
  Trash2,
  Leaf,
  LogIn,
  Tag,
  ShieldCheck,
  X,
  AlertCircle,
} from "lucide-react";
import { usePublicCart } from "@/context/PublicCartContext";
import QuantitySelector from "@/components/QuantitySelector";

export default function PublicCartPage() {
  const router = useRouter();
  const {
    publicCart,
    updatePublicCartQuantity,
    removeFromPublicCart,
    publicCartTotalItems,
    publicCartSubTotal,
    clearPublicCart,
  } = usePublicCart();

  const [showLoginModal, setShowLoginModal] = useState(false);

  const handlePlaceOrder = () => {
    setShowLoginModal(true);
  };

  const handleConfirmLogin = () => {
    setShowLoginModal(false);
    router.push("/login");
  };

  if (publicCartTotalItems === 0) {
    return (
      <div className="min-h-screen bg-[#FAF6ED] flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#F4F9FA] border-b border-[#E3EEF0] shadow-xs">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link
              href="/public/all-items"
              className="p-2 rounded-xl hover:bg-[#0B392B]/10 text-[#0B392B] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-extrabold text-base text-[#0B392B] font-poppins">
              Your Cart
            </span>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 pb-20">
          <div className="w-20 h-20 rounded-full bg-[#0B392B]/10 flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-[#0B392B]" />
          </div>
          <div className="text-center">
            <p className="font-extrabold text-xl text-[#0B251C] font-poppins">Cart is empty</p>
            <p className="text-sm text-gray-500 mt-1">Browse our menu and add some dishes!</p>
          </div>
          <Link
            href="/public/all-items"
            className="bg-[#0B392B] text-white font-bold text-sm px-8 py-3 rounded-xl shadow-xs hover:bg-[#07281E] transition-all active:scale-95"
          >
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6ED] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#F4F9FA] border-b border-[#E3EEF0] shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/public/all-items"
              className="p-2 rounded-xl hover:bg-[#0B392B]/10 text-[#0B392B] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="font-extrabold text-base text-[#0B392B] font-poppins">
                Your Cart
              </span>
              <span className="text-xs text-gray-500 ml-2 font-semibold">
                ({publicCartTotalItems} item{publicCartTotalItems !== 1 ? "s" : ""})
              </span>
            </div>
          </div>
          <button
            onClick={clearPublicCart}
            className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-4 pb-56 flex flex-col gap-3">
        {/* Cart Items */}
        <div className="flex flex-col gap-2.5">
          {publicCart.map((item) => (
            <div
              key={`${item.id}-${item.variant?.id ?? "default"}`}
              className="bg-white rounded-2xl p-3.5 border border-[#EBE5D8] shadow-xs flex items-center gap-3.5"
            >
              {/* Image */}
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100 border border-gray-100">
                <img
                  src={item.image || "/default-food.jpg"}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/default-food.jpg";
                  }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm border border-green-600 flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                  </div>
                  <p className="text-sm font-extrabold text-[#0B251C] truncate font-poppins">
                    {item.name}
                  </p>
                </div>
                {item.variant && (
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">{item.variant.label}</p>
                )}
                <p className="text-sm font-extrabold text-[#0B251C] mt-1">
                  ₹{(item.variant ? item.variant.price : item.price) * item.quantity}
                </p>
              </div>

              {/* Quantity + Remove */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <button
                  onClick={() => removeFromPublicCart(item.id, item.variant?.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <QuantitySelector
                  quantity={item.quantity}
                  onIncrease={() => updatePublicCartQuantity(item.id, 1, item.variant?.id)}
                  onDecrease={() => updatePublicCartQuantity(item.id, -1, item.variant?.id)}
                  size="sm"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Login / Offers Banner */}
        <div className="bg-gradient-to-r from-[#0B392B] to-[#1a5c42] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
              <Tag className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Exclusive Offers & Discounts</p>
              <p className="text-white/70 text-xs mt-0.5 leading-snug">
                Log in to unlock member-only deals and save on every order!
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="shrink-0 flex items-center gap-1.5 bg-white text-[#0B392B] text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all hover:bg-gray-100 active:scale-95 shadow-xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            Login
          </Link>
        </div>

        {/* Price Breakdown */}
        <div className="bg-white rounded-2xl border border-[#EBE5D8] shadow-xs overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-100">
            <p className="font-extrabold text-sm text-[#0B251C] font-poppins">Order Summary</p>
          </div>
          <div className="px-4 py-3 flex flex-col gap-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 font-medium">Subtotal</span>
              <span className="font-bold text-[#0B251C]">₹{publicCartSubTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 font-medium">Discount</span>
              <span className="font-bold text-gray-400">Login to apply</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between">
              <span className="font-extrabold text-[#0B251C]">Total</span>
              <span className="font-extrabold text-[#0B251C] text-lg">
                ₹{publicCartSubTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-center gap-2 px-1">
          <ShieldCheck className="w-4 h-4 text-[#0B392B] shrink-0" />
          <p className="text-xs text-gray-500 font-medium">
            Your cart is saved locally. Login to place your order.
          </p>
        </div>
      </div>

      {/* Fixed Place Order Button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF6ED] border-t border-[#E8E1D3] px-4 pt-3 pb-6 shadow-lg">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-semibold">
              {publicCartTotalItems} item{publicCartTotalItems !== 1 ? "s" : ""}
            </span>
            <span className="font-extrabold text-[#0B251C]">₹{publicCartSubTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={handlePlaceOrder}
            className="w-full bg-[#0B392B] hover:bg-[#07281E] text-white font-extrabold text-sm py-4 rounded-2xl transition-all active:scale-[0.98] shadow-md cursor-pointer"
          >
            Place Order
          </button>
        </div>
      </div>

      {/* Login Required Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setShowLoginModal(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl z-10 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>

              <div>
                <h3 className="font-extrabold text-lg text-[#0B251C] font-poppins">
                  Login Required
                </h3>
                <p className="text-sm text-gray-500 mt-1.5 leading-snug">
                  You need to login first to place an order. Your cart items will be saved and synced automatically after login.
                </p>
              </div>

              <div className="w-full flex flex-col gap-2 mt-1">
                <button
                  onClick={handleConfirmLogin}
                  className="w-full bg-[#0B392B] hover:bg-[#07281E] text-white font-extrabold text-sm py-3.5 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
                >
                  Login to Continue
                </button>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm py-3 rounded-xl transition-all cursor-pointer"
                >
                  Stay in Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

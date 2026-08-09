"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Star, ArrowRight, UtensilsCrossed } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import VegBadge from "@/components/VegBadge";
import QuantitySelector from "@/components/QuantitySelector";
import { useCart, initialMenuItems } from "@/context/CartContext";

export default function HomePage() {
  const { cart, addToCart, updateQuantity, totalItems, totalAmount } = useCart();
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Thali", "Breakfast", "Lunch", "Snacks"];

  const filteredItems =
    selectedCategory === "All"
      ? initialMenuItems
      : initialMenuItems.filter((item) => item.category === selectedCategory);

  const specialItems = initialMenuItems.filter((item) => item.isSpecial);

  const getItemQuantity = (id: string) => {
    const found = cart.find((c) => c.item.id === id);
    return found ? found.quantity : 0;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#FAF6ED] relative">
      {/* Pinned Top Header */}
      <Header />

      {/* Middle Scrollable Section */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-5 pb-20">
        {/* Hero Image Banner */}
        <div className="relative w-full h-44 rounded-2xl overflow-hidden shadow-sm shrink-0">
          <img
            src="https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80"
            alt="Taste Like Home, Feel Like Family"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-4">
            <h1 className="text-white text-lg sm:text-xl font-bold font-poppins leading-snug drop-shadow-md">
              Taste Like Home, Feel Like Family
            </h1>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 shrink-0">
          {["Pure Veg", "Fresh", "Hygienic", "Affordable"].map((tag) => (
            <span
              key={tag}
              className="px-3.5 py-1.5 rounded-full bg-[#EAF5EE] text-[#0B392B] text-xs font-semibold whitespace-nowrap border border-[#D5EBDC]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Today's Special Section */}
        <div>
          <h2 className="text-lg font-bold text-[#0B251C] mb-3 font-poppins">
            Today's Special
          </h2>
          <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar pb-2">
            {specialItems.map((item) => {
              const qty = getItemQuantity(item.id);
              return (
                <div
                  key={item.id}
                  className="w-64 shrink-0 bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-2xs flex flex-col justify-between"
                >
                  <div className="relative h-32 w-full bg-gray-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-[#FFCC00] text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                      <Star className="w-3 h-3 fill-black text-black" />
                      Special
                    </div>
                  </div>

                  <div className="p-3 flex flex-col gap-1 flex-1 justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-sm text-[#0B251C] truncate">
                          {item.name}
                        </h3>
                        <VegBadge size={14} />
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                      <span className="font-extrabold text-sm text-[#0B251C]">
                        ₹{item.price}
                      </span>
                      {qty > 0 ? (
                        <QuantitySelector
                          quantity={qty}
                          onIncrease={() => updateQuantity(item.id, 1)}
                          onDecrease={() => updateQuantity(item.id, -1)}
                          size="sm"
                        />
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="bg-[#0B392B] hover:bg-[#07281E] text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          ADD
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 shrink-0">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#0B392B] text-white shadow-xs"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-[#0B392B]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Menu Item List or Empty State */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 flex flex-col items-center justify-center gap-2 my-2 shadow-2xs">
            <UtensilsCrossed className="w-10 h-10 text-gray-300" />
            <p className="text-sm font-bold text-[#0B251C]">No items found</p>
            <p className="text-xs text-gray-500 max-w-xs">
              There are currently no dishes available in the "{selectedCategory}" category.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredItems.map((item) => {
              const qty = getItemQuantity(item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-2xs flex items-center gap-3.5"
                >
                  {/* Image */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between min-h-20 py-0.5">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-[#0B251C]">
                          {item.name}
                        </h3>
                        <VegBadge size={14} />
                      </div>
                      <p className="text-[11px] text-gray-500 leading-snug mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="font-extrabold text-base text-[#0B251C]">
                        ₹{item.price}
                      </span>

                      {qty > 0 ? (
                        <QuantitySelector
                          quantity={qty}
                          onIncrease={() => updateQuantity(item.id, 1)}
                          onDecrease={() => updateQuantity(item.id, -1)}
                          size="sm"
                        />
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="border-2 border-[#0B392B] text-[#0B392B] hover:bg-[#0B392B] hover:text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          ADD
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Cart Bar */}
      {totalItems > 0 && (
        <div className="absolute left-0 right-0 px-4 py-2 z-30 pointer-events-none" style={{ bottom: 72 }}>
          <div className="pointer-events-auto bg-[#C51E1E] text-white rounded-2xl p-3 shadow-xl flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-extrabold uppercase tracking-wide">
                {totalItems} {totalItems === 1 ? "ITEM" : "ITEMS"}
              </span>
              <span className="text-xs font-bold opacity-90">
                Total: ₹{totalAmount}
              </span>
            </div>

            <Link
              href="/cart"
              className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors border border-white/30"
            >
              View Cart <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Pinned Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

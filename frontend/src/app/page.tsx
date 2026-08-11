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
    <div className="flex flex-col h-dvh overflow-hidden bg-[#FAF6ED] relative">
      {/* Fixed Top Header */}
      <Header />

      {/* Middle Scrollable Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-5 max-w-5xl w-full mx-auto flex flex-col gap-4 pb-20">
        {/* Hero Image Banner */}
        <div className="relative w-full h-36 sm:h-52 lg:h-64 rounded-2xl overflow-hidden shadow-sm shrink-0">
          <img
            src="https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=1200&q=80"
            alt="Taste Like Home, Feel Like Family"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-4 sm:p-6">
            <h1 className="text-white text-lg sm:text-2xl lg:text-3xl font-extrabold font-poppins leading-snug drop-shadow-md max-w-xl">
              Taste Like Home, Feel Like Family
            </h1>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-0.5 shrink-0">
          {["Pure Veg", "Fresh", "Hygienic", "Affordable"].map((tag) => (
            <span
              key={tag}
              className="px-4 py-2 rounded-full bg-[#EAF5EE] text-[#0B392B] text-xs sm:text-sm font-semibold whitespace-nowrap border border-[#D5EBDC]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Today's Special Section */}
        <div>
          <h2 className="text-xl font-bold text-[#0B251C] mb-3 font-poppins">
            Today's Special
          </h2>
          <div className="flex items-stretch gap-4 overflow-x-auto no-scrollbar py-1 shrink-0">
            {specialItems.map((item) => {
              const qty = getItemQuantity(item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-2xs flex flex-col justify-between w-64 sm:w-72 shrink-0"
                >
                  <div className="relative h-36 sm:h-44 w-full bg-gray-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-[#FFCC00] text-black text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                      <Star className="w-3.5 h-3.5 fill-black text-black" />
                      Special
                    </div>
                  </div>

                  <div className="p-4 flex flex-col gap-2 flex-1 justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-base text-[#0B251C] truncate">
                          {item.name}
                        </h3>
                        <VegBadge size={16} />
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                      <span className="font-extrabold text-base sm:text-lg text-[#0B251C]">
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
                          className="bg-[#0B392B] hover:bg-[#07281E] text-white text-xs font-bold px-5 py-2 rounded-xl transition-colors cursor-pointer"
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
                className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
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
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 flex flex-col items-center justify-center gap-3 my-2 shadow-2xs">
            <UtensilsCrossed className="w-12 h-12 text-gray-300" />
            <p className="text-base font-bold text-[#0B251C]">No items found</p>
            <p className="text-xs sm:text-sm text-gray-500 max-w-xs">
              There are currently no dishes available in the "{selectedCategory}" category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const qty = getItemQuantity(item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex items-center gap-4"
                >
                  {/* Image */}
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between min-h-24 py-0.5">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-[#0B251C]">
                          {item.name}
                        </h3>
                        <VegBadge size={16} />
                      </div>
                      <p className="text-xs text-gray-500 leading-snug mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="font-extrabold text-base sm:text-lg text-[#0B251C]">
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

      {/* Floating Bottom Cart Bar / Badge */}
      {totalItems > 0 && (
        <div className="fixed bottom-16 sm:bottom-20 right-4 sm:right-6 z-50 group">
          {/* Default Compact Floating Icon (No Price) */}
          <div className="flex items-center justify-center bg-[#C51E1E] text-white p-3.5 rounded-full shadow-2xl cursor-pointer group-hover:opacity-0 group-hover:scale-75 group-hover:pointer-events-none border-2 border-white transition-all duration-300 transform">
            <div className="relative flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6" />
              <span className="absolute -top-3 -right-3 bg-white text-[#C51E1E] text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-md border border-[#C51E1E]">
                {totalItems}
              </span>
            </div>
          </div>

          {/* Smooth Hover Expanding Container */}
          <div className="absolute bottom-0 right-0 opacity-0 scale-75 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto bg-[#C51E1E] text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 w-72 sm:w-80 border border-white/30 transition-all duration-300 origin-bottom-right transform">
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
              className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors border border-white/30 whitespace-nowrap"
            >
              View Cart <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

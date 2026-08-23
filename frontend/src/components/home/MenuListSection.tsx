"use client";

import React from "react";
import { UtensilsCrossed, Clock, Star, Loader2 } from "lucide-react";
import VegBadge from "@/components/VegBadge";
import MenuItemCard from "@/components/MenuItemCard";
import { MenuItem as CartMenuItem } from "@/context/CartContext";

interface MenuListSectionProps {
  filteredItems: CartMenuItem[];
  selectedCategory: string;
  loading: boolean;
  loadingMore?: boolean;
  getItemQuantity: (id: string) => number;
  addToCart: (item: CartMenuItem) => void;
  updateQuantity: (id: string, delta: number) => void;
}

export default function MenuListSection({
  filteredItems,
  selectedCategory,
  loading,
  loadingMore,
  getItemQuantity,
  addToCart,
  updateQuantity,
}: MenuListSectionProps) {
  // Limit to 10 items for Explore Menu section on Home screen
  const displayedItems = filteredItems.slice(0, 10);

  return (
    <section className="flex flex-col gap-3">
      {/* Menu Cards List / Empty State / Loader */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-[#0B392B]" />
          <span className="text-xs font-semibold">Loading menu dishes...</span>
        </div>
      ) : displayedItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#E8E1D3] flex flex-col items-center justify-center gap-3 my-2 shadow-2xs">
          <UtensilsCrossed className="w-12 h-12 text-gray-300" />
          <p className="text-base font-bold text-[#0B251C]">No items found</p>
          <p className="text-xs sm:text-sm text-gray-500 max-w-xs">
            There are currently no dishes available in the "{selectedCategory}" category.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {displayedItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                quantity={getItemQuantity(item.id)}
                onAdd={(itemToAdd) => addToCart(itemToAdd as any)}
                onUpdateQuantity={updateQuantity}
              />
            ))}
          </div>

          {/* Explore All Items Navigation Button */}
          <div className="pt-2 pb-1 flex justify-center">
            <a
              href="/all-items"
              className="bg-white hover:bg-emerald-50 text-[#0B392B] border border-[#0B392B]/30 hover:border-[#0B392B] font-extrabold text-xs px-6 py-2.5 rounded-2xl transition-all shadow-2xs flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Explore All Items</span>
              <span className="text-sm">→</span>
            </a>
          </div>
        </div>
      )}
    </section>
  );
}

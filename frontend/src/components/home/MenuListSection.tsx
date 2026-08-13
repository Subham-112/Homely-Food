"use client";

import React from "react";
import { UtensilsCrossed, Clock, Star, Loader2 } from "lucide-react";
import VegBadge from "@/components/VegBadge";
import QuantitySelector from "@/components/QuantitySelector";
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
  return (
    <section className="flex flex-col gap-3">
      {/* Menu Cards List / Empty State / Loader */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-[#0B392B]" />
          <span className="text-xs font-semibold">Loading menu dishes...</span>
        </div>
      ) : filteredItems.length === 0 ? (
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
            {filteredItems.map((item) => {
              const qty = getItemQuantity(item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-2.5 sm:p-4 border border-[#EBE5D8] shadow-2xs hover:shadow-xs hover:border-[#0B392B]/30 transition-all flex items-center gap-3.5"
                >
                  {/* Left Dish Image */}
                  <div className="relative w-24 h-24 sm:w-26 sm:h-26 rounded-xl overflow-hidden shrink-0 bg-gray-100 border border-gray-100 shadow-2xs">
                    <img
                      src={item.image || "/default-food.jpg"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/default-food.jpg";
                      }}
                    />
                    {item.isSpecial && (
                      <div className="absolute top-1.5 left-1.5 bg-[#FFCC00] text-black text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-2xs uppercase tracking-wider">
                        <Star className="w-2.5 h-2.5 fill-black text-black" /> Special
                      </div>
                    )}
                  </div>

                  {/* Right Content */}
                  <div className="flex-1 flex flex-col justify-between h-full py-0.5 min-w-0">
                    <div>
                      {/* Header Row: Title & Veg Badge */}
                      <div className="flex items-center justify-between gap-1.5">
                        <h3 className="text-sm sm:text-base font-extrabold text-[#0B251C] truncate font-poppins">
                          {item.name}
                        </h3>
                        <VegBadge size={16} />
                      </div>

                      {/* Prep Time Metadata from API */}
                      {item.preparationTime !== undefined && (
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 mt-0.5 mb-1">
                          <Clock className="w-3 h-3 text-[#0B392B]" />
                          <span>{item.preparationTime} mins prep</span>
                        </div>
                      )}

                      {/* Description - 2 Lines max with line-clamp-2 */}
                      <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-snug mt-0.5">
                        {item.description || "Authentic home cooked dish prepared fresh with natural ingredients."}
                      </p>
                    </div>

                    {/* Price & Action Row */}
                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-100/80">
                      <span className="font-extrabold text-base sm:text-lg text-[#0B251C] shrink-0">
                        ₹{item.price}
                      </span>

                      {qty > 0 ? (
                        <div className="shrink-0">
                          <QuantitySelector
                            quantity={qty}
                            onIncrease={() => updateQuantity(item.id, 1)}
                            onDecrease={() => updateQuantity(item.id, -1)}
                            size="sm"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="bg-[#0B392B] hover:bg-[#07281E] text-white text-xs font-extrabold px-5 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95 shadow-2xs shrink-0 whitespace-nowrap"
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

          {/* Loading More Spinner at List Bottom */}
          {loadingMore && (
            <div className="py-6 flex items-center justify-center text-gray-500 gap-2 text-xs font-semibold">
              <Loader2 className="w-5 h-5 animate-spin text-[#0B392B]" />
              <span>Loading more delicious dishes...</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

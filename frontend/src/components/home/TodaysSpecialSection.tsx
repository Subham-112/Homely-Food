"use client";

import React from "react";
import { Star, Clock, Flame } from "lucide-react";
import VegBadge from "@/components/VegBadge";
import QuantitySelector from "@/components/QuantitySelector";
import { MenuItem as CartMenuItem } from "@/context/CartContext";

interface TodaysSpecialSectionProps {
  specialItems: CartMenuItem[];
  getItemQuantity: (id: string) => number;
  addToCart: (item: CartMenuItem) => void;
  updateQuantity: (id: string, delta: number) => void;
}

export default function TodaysSpecialSection({
  specialItems,
  getItemQuantity,
  addToCart,
  updateQuantity,
}: TodaysSpecialSectionProps) {
  if (!specialItems || specialItems.length === 0) return null;

  return (
    <section className="flex flex-col gap-2.5">
      {/* Section Header */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FFCC00]/20 text-[#0B251C] flex items-center justify-center">
            <Flame className="w-4 h-4 text-[#D97706]" />
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-[#0B251C] font-poppins tracking-tight">
            Today's Special
          </h2>
        </div>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
          <Star className="w-3 h-3 fill-[#FFCC00] text-[#D97706]" /> Chef Recommended
        </span>
      </div>

      {/* Horizontal Cards Slider - Slightly Increased Size */}
      <div className="flex items-stretch gap-2 overflow-x-auto no-scrollbar py-1 shrink-0">
        {specialItems.map((item) => {
          const qty = getItemQuantity(item.id);
          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-[#E8E1D3] shadow-xs hover:shadow-sm transition-all flex flex-col justify-between w-56 sm:w-60 shrink-0 overflow-hidden"
            >
              {/* Image & Badges Overlay */}
              <div className="relative h-32 sm:h-36 w-full bg-gray-100 shrink-0">
                <img
                  src={item.image || "/default-food.jpg"}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/default-food.jpg";
                  }}
                />
                {/* Special Tag Badge */}
                <div className="absolute top-2 left-2 bg-[#FFCC00] text-black text-[9px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-2xs uppercase tracking-wider">
                  <Star className="w-2.5 h-2.5 fill-black text-black" />
                  Special
                </div>
              </div>

              {/* Card Body & Details */}
              <div className="p-3 sm:p-3.5 flex flex-col gap-1.5 flex-1 justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h3 className="font-extrabold text-xs sm:text-sm text-[#0B251C] truncate font-poppins">
                      {item.name}
                    </h3>
                    <VegBadge size={15} />
                  </div>

                  {/* Metadata Row from API */}
                  {item.preparationTime !== undefined && (
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 mb-1">
                      <Clock className="w-3 h-3 text-[#0B392B]" />
                      <span>{item.preparationTime} mins prep</span>
                    </div>
                  )}

                  <p className="text-[11px] text-gray-500 leading-tight line-clamp-1">
                    {item.description || "Freshly cooked homestyle special dish."}
                  </p>
                </div>

                {/* Card Footer: Price & Action */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 mt-1">
                  <span className="font-extrabold text-sm sm:text-base text-[#0B251C] shrink-0">
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
                      className="bg-[#0B392B] hover:bg-[#07281E] text-white text-xs font-extrabold px-4 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
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
    </section>
  );
}

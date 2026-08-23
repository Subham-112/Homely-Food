"use client";

import React from "react";
import { Clock, Star } from "lucide-react";
import VegBadge from "@/components/VegBadge";
import QuantitySelector from "@/components/QuantitySelector";

export interface MenuItemCardData {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  isSpecial?: boolean;
  preparationTime?: number;
}

interface MenuItemCardProps {
  item: MenuItemCardData;
  quantity: number;
  onAdd: (item: MenuItemCardData) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
}

export default function MenuItemCard({
  item,
  quantity,
  onAdd,
  onUpdateQuantity,
}: MenuItemCardProps) {
  return (
    <div className="bg-white rounded-2xl p-2.5 sm:p-4 border border-[#EBE5D8] shadow-2xs hover:shadow-xs hover:border-[#0B392B]/30 transition-all flex items-center gap-3.5 w-full">
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

          {/* Description - 2 Lines max */}
          <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-snug mt-0.5">
            {item.description || "Authentic home cooked dish prepared fresh with natural ingredients."}
          </p>
        </div>

        {/* Price & Action Row */}
        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-100/80">
          <span className="font-extrabold text-base sm:text-lg text-[#0B251C] shrink-0">
            ₹{item.price}
          </span>

          {quantity > 0 ? (
            <div className="shrink-0">
              <QuantitySelector
                quantity={quantity}
                onIncrease={() => onUpdateQuantity(item.id, 1)}
                onDecrease={() => onUpdateQuantity(item.id, -1)}
                size="sm"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAdd(item)}
              className="bg-[#0B392B] hover:bg-[#07281E] text-white text-xs font-extrabold px-5 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95 shadow-2xs shrink-0 whitespace-nowrap"
            >
              ADD
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

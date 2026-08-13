"use client";

import React from "react";
import { UtensilsCrossed } from "lucide-react";

interface CategorySectionProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  totalItemsCount?: number;
}

export default function CategorySection({
  categories,
  selectedCategory,
  onSelectCategory,
  totalItemsCount,
}: CategorySectionProps) {
  return (
    <section className="flex flex-col gap-2.5 pt-1">
      {/* Section Header above Category Pills */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#0B392B]/10 text-[#0B392B] flex items-center justify-center">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-[#0B251C] font-poppins tracking-tight">
            Explore Menu
          </h2>
        </div>
        {totalItemsCount !== undefined && (
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            {totalItemsCount} {totalItemsCount === 1 ? "Item" : "Items"}
          </span>
        )}
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 shrink-0">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                isSelected
                  ? "bg-[#0B392B] text-white shadow-xs border border-[#0B392B]"
                  : "bg-white text-[#0B251C] border border-[#E8E1D3] hover:border-[#0B392B]/50"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </section>
  );
}

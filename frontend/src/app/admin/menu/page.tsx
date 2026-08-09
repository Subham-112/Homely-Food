"use client";

import React, { useState } from "react";
import { Plus, Edit2 } from "lucide-react";
import Header from "@/components/Header";
import AdminBottomNav from "@/components/AdminBottomNav";
import VegBadge from "@/components/VegBadge";

interface AdminMenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  available: boolean;
  category: string;
}

export default function AdminMenuPage() {
  const [selectedCategory, setSelectedCategory] = useState("All Items");
  const [items, setItems] = useState<AdminMenuItem[]>([
    {
      id: "1",
      name: "Deluxe North Indian...",
      price: 250,
      image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80",
      available: true,
      category: "Thalis",
    },
    {
      id: "2",
      name: "Classic Indori Poha",
      price: 80,
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
      available: true,
      category: "Breakfast",
    },
    {
      id: "3",
      name: "Punjabi Samosa (2...",
      price: 50,
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
      available: false,
      category: "Snacks",
    },
  ]);

  const categories = ["All Items", "Thalis", "Breakfast", "Snacks"];

  const filteredItems =
    selectedCategory === "All Items"
      ? items
      : items.filter((i) => i.category === selectedCategory);

  const toggleAvailability = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, available: !item.available } : item
      )
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#F4F8FA] relative">
      {/* Header */}
      <Header />

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 pb-20">
        {/* Title Row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#0B251C] font-poppins">
              Menu Management
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Manage your offerings.
            </p>
          </div>

          <button className="bg-[#0B392B] hover:bg-[#07281E] text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer">
            <Plus className="w-4 h-4" /> New Item
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 shrink-0">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#0B392B] text-white shadow-xs"
                    : "bg-[#EBF4FA] text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Item Cards */}
        <div className="flex flex-col gap-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-3 border border-gray-100/90 shadow-2xs flex items-center gap-3"
            >
              {/* Image with Veg badge overlay */}
              <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1.5 left-1.5">
                  <VegBadge size={14} />
                </div>
              </div>

              {/* Item Info */}
              <div className="flex-1 flex flex-col justify-between h-24 py-0.5">
                <div className="flex items-start justify-between gap-1">
                  <h3 className="font-extrabold text-sm text-[#0B251C] truncate">
                    {item.name}
                  </h3>
                  <button className="text-gray-400 hover:text-gray-700 p-0.5 cursor-pointer">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <span className="font-extrabold text-base text-[#0B251C]">
                  ₹{item.price}
                </span>

                {/* Available Toggle Switch */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                  <span className="text-xs font-semibold text-gray-600">
                    {item.available ? "Available" : "Out of Stock"}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleAvailability(item.id)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      item.available ? "bg-[#2563EB]" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        item.available ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pinned Bottom Navigation */}
      <AdminBottomNav />
    </div>
  );
}

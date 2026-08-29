"use client";

import React from "react";
import { X, Plus, Clock } from "lucide-react";
import VegBadge from "./VegBadge";
import QuantitySelector from "./QuantitySelector";
import { CartItem, MenuItem as CartMenuItem } from "@/context/CartContext";

interface VariantItem {
  _id?: string;
  id?: string;
  label: string;
  price: number;
  discountPercent?: number;
  discountedPrice?: number;
  status?: string;
}

interface VariantSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CartMenuItem | null;
  cart: CartItem[];
  onAddToCart: (item: CartMenuItem, variant: { id: string; label: string; price: number }) => void;
  onUpdateQuantity: (itemId: string, delta: number, variantId?: string) => void;
}

export default function VariantSelectionModal({
  isOpen,
  onClose,
  item,
  cart,
  onAddToCart,
  onUpdateQuantity,
}: VariantSelectionModalProps) {
  if (!isOpen || !item) return null;

  const variants: VariantItem[] = (item.variants as VariantItem[]) || [];

  const getVariantQuantity = (variantId?: string) => {
    if (!variantId) return 0;
    const found = cart.find(
      (c) => c.item.id === item.id && (c.variant?.id === variantId || (c.variant as any)?._id === variantId)
    );
    return found ? found.quantity : 0;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-4 sm:p-5 max-w-md w-full shadow-2xl flex flex-col gap-4 border border-[#E8E1D3] relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100 border border-gray-200/80">
              <img
                src={item.image || "/default-food.jpg"}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/default-food.jpg";
                }}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm sm:text-base text-[#0B251C] font-poppins truncate">
                  {item.name}
                </h3>
                <VegBadge size={14} />
              </div>
              <span className="text-[11px] text-gray-500 font-medium line-clamp-1 mt-0.5">
                Select your preferred option / size
              </span>
              {item.preparationTime !== undefined && (
                <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 mt-0.5">
                  <Clock className="w-3 h-3 text-[#0B392B]" />
                  <span>{item.preparationTime} mins prep</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Variants List */}
        <div className="flex flex-col gap-2.5 overflow-y-auto no-scrollbar py-1">
          {variants.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-500">No variants available for this item.</div>
          ) : (
            variants.map((v, idx) => {
              const variantId = v._id || v.id || `v-${idx}`;
              const qty = getVariantQuantity(variantId);
              const hasDiscount = Boolean(v.discountPercent && v.discountPercent > 0);
              const effectivePrice =
                hasDiscount && v.discountedPrice !== undefined ? v.discountedPrice : v.price;

              return (
                <div
                  key={variantId}
                  className="bg-[#FAF6ED] border border-[#E8E1D3] hover:border-[#0B392B]/40 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 transition-all"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs sm:text-sm text-[#0B251C]">
                        {v.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-xs sm:text-sm text-[#0B392B]">
                        ₹{effectivePrice}
                      </span>
                      {hasDiscount && (
                        <>
                          <span className="text-[11px] text-gray-400 line-through font-semibold">
                            ₹{v.price}
                          </span>
                          <span className="text-[9px] font-black text-emerald-700 bg-emerald-100/90 border border-emerald-200/80 px-1.5 py-0.5 rounded-md">
                            {v.discountPercent}% OFF
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {qty > 0 ? (
                      <QuantitySelector
                        quantity={qty}
                        onIncrease={() => onUpdateQuantity(item.id, 1, variantId)}
                        onDecrease={() => onUpdateQuantity(item.id, -1, variantId)}
                        size="sm"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          onAddToCart(item, {
                            id: variantId,
                            label: v.label,
                            price: effectivePrice,
                          })
                        }
                        className="bg-[#0B392B] hover:bg-[#07281E] text-white text-xs font-extrabold px-4 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95 shadow-2xs whitespace-nowrap flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ADD</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Done button */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-[#0B392B] hover:bg-[#07281E] text-white font-extrabold text-xs sm:text-sm py-2.5 rounded-xl transition-all shadow-xs cursor-pointer text-center"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

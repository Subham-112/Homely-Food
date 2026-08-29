"use client";

import React, { useState } from "react";
import { Clock, Star, Layers, Plus } from "lucide-react";
import VegBadge from "@/components/VegBadge";
import QuantitySelector from "@/components/QuantitySelector";
import VariantSelectionModal from "@/components/VariantSelectionModal";
import { useCart } from "@/context/CartContext";

export interface MenuItemVariantData {
  _id?: string;
  id?: string;
  label: string;
  price: number;
  discountPercent?: number;
  discountedPrice?: number;
  status?: string;
}

export interface MenuItemCardData {
  id: string;
  name: string;
  price: number;
  discountPercent?: number;
  discountedPrice?: number;
  description?: string;
  image?: string;
  isSpecial?: boolean;
  preparationTime?: number;
  category?: string;
  variants?: MenuItemVariantData[] | null;
}

interface MenuItemCardProps {
  item: MenuItemCardData;
  quantity: number;
  onAdd: (item: MenuItemCardData, variant?: { id: string; label: string; price: number }) => void;
  onUpdateQuantity: (id: string, delta: number, variantId?: string) => void;
}

function MenuItemCardComponent({
  item,
  quantity,
  onAdd,
  onUpdateQuantity,
}: MenuItemCardProps) {
  const { cart, addToCart } = useCart();
  const [showVariantModal, setShowVariantModal] = useState(false);

  const hasMultipleVariants = Boolean(item.variants && item.variants.length > 1);
  const singleVariant = item.variants && item.variants.length === 1 ? item.variants[0] : null;

  const hasDiscount = Boolean(item.discountPercent && item.discountPercent > 0);
  const displayPrice = hasDiscount && item.discountedPrice !== undefined ? item.discountedPrice : item.price;

  // Calculate total quantity of all variants of this item in cart
  const totalItemCartQty = cart
    .filter((c) => c.item.id === item.id)
    .reduce((sum, c) => sum + c.quantity, 0);

  const handleAddClick = () => {
    if (hasMultipleVariants) {
      setShowVariantModal(true);
    } else if (singleVariant) {
      const variantId = singleVariant._id || singleVariant.id || "single";
      const varPrice =
        singleVariant.discountPercent && singleVariant.discountedPrice !== undefined
          ? singleVariant.discountedPrice
          : singleVariant.price;
      onAdd(item, {
        id: variantId,
        label: singleVariant.label,
        price: varPrice,
      });
    } else {
      onAdd(item);
    }
  };

  return (
    <>
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
            {/* Price section: Do not show price if item has multiple variants */}
            {hasMultipleVariants ? (
              <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#0B392B]" />
                Customisable
              </span>
            ) : (
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span className="font-extrabold text-base sm:text-lg text-[#0B251C] shrink-0">
                  ₹{displayPrice}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-xs text-gray-400 line-through font-semibold shrink-0">
                      ₹{item.price}
                    </span>
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 shrink-0">
                      {item.discountPercent}% OFF
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Action button */}
            {hasMultipleVariants ? (
              <button
                type="button"
                onClick={() => setShowVariantModal(true)}
                className="bg-[#0B392B] hover:bg-[#07281E] text-white text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95 shadow-2xs shrink-0 whitespace-nowrap flex items-center gap-1"
              >
                <span>Select Variant</span>
                {totalItemCartQty > 0 && (
                  <span className="bg-[#FFCC00] text-black text-[9px] font-black px-1.5 py-0.2 rounded-full ml-0.5">
                    {totalItemCartQty}
                  </span>
                )}
              </button>
            ) : quantity > 0 ? (
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
                onClick={handleAddClick}
                className="bg-[#0B392B] hover:bg-[#07281E] text-white text-xs font-extrabold px-5 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95 shadow-2xs shrink-0 whitespace-nowrap"
              >
                ADD
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Variant Selection Modal */}
      {hasMultipleVariants && (
        <VariantSelectionModal
          isOpen={showVariantModal}
          onClose={() => setShowVariantModal(false)}
          item={item as any}
          cart={cart}
          onAddToCart={(itm, v) => addToCart(itm as any, v)}
          onUpdateQuantity={(id, delta, vId) => onUpdateQuantity(id, delta, vId)}
        />
      )}
    </>
  );
}

const MenuItemCard = React.memo(MenuItemCardComponent);
export default MenuItemCard;

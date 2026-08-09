import React from "react";
import { Plus, Minus } from "lucide-react";

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  size?: "sm" | "md";
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onIncrease,
  onDecrease,
  size = "md",
}) => {
  const isSm = size === "sm";

  return (
    <div
      className={`inline-flex items-center justify-between bg-[#EBF5FC] rounded-full border border-[#D4E8F8] px-3 py-1 ${
        isSm ? "w-24 text-xs font-semibold" : "w-28 text-sm font-semibold"
      } text-[#0B392B]`}
    >
      <button
        type="button"
        onClick={onDecrease}
        className="p-1 hover:bg-[#D8EDFC] rounded-full transition-colors flex items-center justify-center text-[#0B392B]"
        aria-label="Decrease quantity"
      >
        <Minus className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
      </button>
      <span className="px-2 font-bold text-[#0B392B]">{quantity}</span>
      <button
        type="button"
        onClick={onIncrease}
        className="p-1 hover:bg-[#D8EDFC] rounded-full transition-colors flex items-center justify-center text-[#0B392B]"
        aria-label="Increase quantity"
      >
        <Plus className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
      </button>
    </div>
  );
};

export default QuantitySelector;

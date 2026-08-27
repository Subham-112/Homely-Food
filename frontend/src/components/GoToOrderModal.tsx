"use client";

import React, { useState } from "react";
import { Search, X, Loader2, ArrowRight, AlertCircle, FileText } from "lucide-react";
import { getOrderById, Order } from "@/services/orderService";

interface GoToOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderFound: (order: Order) => void;
}

export const GoToOrderModal: React.FC<GoToOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderFound,
}) => {
  const [orderNumberInput, setOrderNumberInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawVal = orderNumberInput.trim();
    if (!rawVal) {
      setError("Please enter an order number.");
      return;
    }

    // Auto-prefix ORD- if user enters pure numbers like "671481138"
    let targetOrderNumber = rawVal;
    if (/^\d+$/.test(rawVal)) {
      targetOrderNumber = `ORD-${rawVal}`;
    }

    setIsLoading(true);
    setError(null);

    try {
      const order = await getOrderById(targetOrderNumber);
      if (order) {
        setOrderNumberInput("");
        setError(null);
        onClose();
        onOrderFound(order);
      } else {
        setError(`Order "${targetOrderNumber}" not found.`);
      }
    } catch (err: any) {
      console.error("Failed to find order by number:", err);
      setError(err?.message || `Order "${targetOrderNumber}" not found.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setError(null);
    setOrderNumberInput("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 border border-[#E8E1D3] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0B251C]">Go to Order</h3>
              <p className="text-[11px] text-gray-400 font-medium">Quick lookup by order ID</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded-xl font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-extrabold text-gray-700">Order Number</label>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#0B392B] focus-within:bg-white shadow-2xs transition-all">
              <span className="bg-gray-100 text-[#0B392B] text-xs font-black px-3 py-2.5 border-r border-gray-200 select-none tracking-wider">
                ORD -
              </span>
              <input
                type="text"
                autoFocus
                placeholder="671481138"
                value={orderNumberInput}
                onChange={(e) => {
                  let val = e.target.value;
                  // If user pastes full ORD-671481138, strip ORD- or ORD =
                  if (val.toUpperCase().startsWith("ORD-") || val.toUpperCase().startsWith("ORD=")) {
                    val = val.substring(4).trim();
                  } else if (val.toUpperCase().startsWith("ORD -") || val.toUpperCase().startsWith("ORD =")) {
                    val = val.substring(5).trim();
                  }
                  setOrderNumberInput(val);
                }}
                className="w-full px-3 py-2.5 text-xs font-bold text-gray-800 focus:outline-none bg-transparent"
              />
            </div>
            <span className="text-[10px] text-gray-400 font-medium">
              Enter the numeric code or full order ID (e.g. ORD-671481138).
            </span>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="w-1/3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !orderNumberInput.trim()}
              className="w-2/3 py-2.5 bg-[#0B392B] hover:bg-[#07281E] text-white text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Finding...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoToOrderModal;

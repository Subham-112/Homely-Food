"use client";

import React from "react";
import { Coins, Sparkles, CheckCircle2, Gift, X } from "lucide-react";
import Link from "next/link";

interface WelcomeBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  bonusAmount?: number;
}

export const WelcomeBonusModal: React.FC<WelcomeBonusModalProps> = ({
  isOpen,
  onClose,
  bonusAmount = 50,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-[#E8E1D3] relative overflow-hidden flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Animated Coins Graphic */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 border-4 border-amber-300 flex items-center justify-center shadow-lg relative my-2">
          <Coins className="w-10 h-10 text-amber-600 animate-bounce" />
          <div className="absolute -top-1 -right-1 bg-amber-400 text-amber-950 p-1 rounded-full shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* Main Title */}
        <div>
          <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full text-[11px] font-extrabold uppercase tracking-wider mb-2">
            Welcome Bonus Gift! 🎉
          </span>
          <h3 className="text-xl font-extrabold text-[#0B251C] font-poppins">
            You Received {bonusAmount} Homely Coins!
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Thank you for joining Homely-Food! Your welcome coins are already credited to your wallet.
          </p>
        </div>

        {/* Use Cases Box */}
        <div className="w-full bg-[#FAF6ED] rounded-2xl p-4 border border-[#E8E1D3] text-left flex flex-col gap-2 text-xs">
          <span className="font-extrabold text-[#0B251C] flex items-center gap-1.5 text-xs">
            <Gift className="w-4 h-4 text-amber-600" /> What can you do with Homely Coins?
          </span>
          <ul className="space-y-1.5 text-gray-600 text-[11px] font-medium">
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>1 Coin = ₹1 Value</strong>: Redeem directly against your upcoming orders.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Earn More on Orders</strong>: Get up to 10%–15% bonus coins every time you order!</span>
            </li>
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="w-full flex flex-col gap-2 pt-1">
          <button
            onClick={onClose}
            className="w-full bg-[#0B392B] hover:bg-[#07281E] text-white font-extrabold py-3 rounded-2xl transition cursor-pointer shadow-xs text-xs"
          >
            Start Ordering & Redeem Coins
          </button>
          <Link
            href="/wallet"
            onClick={onClose}
            className="w-full py-2 text-xs text-gray-500 hover:text-[#0B392B] font-bold transition text-center"
          >
            View Coin Wallet Ledger →
          </Link>
        </div>
      </div>
    </div>
  );
};

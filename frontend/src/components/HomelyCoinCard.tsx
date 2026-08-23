"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, ChevronRight } from "lucide-react";
import { useCoins } from "@/context/CoinContext";
import { formatUTCToIST } from "@/utils/datetime";

interface HomelyCoinCardProps {
  showActionLink?: boolean;
}

export const HomelyCoinCard: React.FC<HomelyCoinCardProps> = ({ showActionLink = false }) => {
  const { wallet } = useCoins();

  // Check if wallet balance expires within 3 days (72 hours)
  const getExpiryNotice = (): { shouldShow: boolean; formattedDate: string; daysLeft: number } => {
    if (!wallet?.nextExpiryCheckAt || (wallet.balance ?? 0) <= 0) {
      return { shouldShow: false, formattedDate: "", daysLeft: 0 };
    }

    const expiryTime = new Date(wallet.nextExpiryCheckAt).getTime();
    const nowTime = Date.now();
    const diffMs = expiryTime - nowTime;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Show ONLY if expiring within 3 days (between 0 and 3 days)
    if (diffDays >= 0 && diffDays <= 3) {
      return {
        shouldShow: true,
        formattedDate: formatUTCToIST(wallet.nextExpiryCheckAt).split(",")[0],
        daysLeft: diffDays === 0 ? 1 : diffDays,
      };
    }

    return { shouldShow: false, formattedDate: "", daysLeft: 0 };
  };

  const expiryInfo = getExpiryNotice();

  return (
    <div className="w-full shrink-0 bg-gradient-to-br from-[#0B392B] via-[#07281E] to-[#041A14] text-white rounded-2xl p-3.5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col gap-3 border border-[#0B392B]/80 group">
      {/* Background Decorative Pattern & Glow */}
      <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
      <div className="absolute -left-10 -top-10 w-36 h-36 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

      {/* Main Container: 40% Left Image, 60% Right Content */}
      <div className="flex items-center gap-2 z-10 w-full">
        {/* Left Side (40% width) */}
        <div className="w-[40%] shrink-0 flex items-center justify-center">
          <div className="w-full aspect-square max-w-[120px] sm:max-w-[120px] flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <Image
              src="/Homely-coin.png"
              alt="Homely Coin"
              width={100}
              height={100}
              className="w-full h-full object-contain drop-shadow-xl group-hover:rotate-6 transition-transform duration-300"
            />
          </div>
        </div>

        {/* Right Side (60% width) */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          {/* Header & Expiry Badge */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between gap-1">
              <h2 className="text-base sm:text-lg font-extrabold font-poppins text-amber-300 tracking-wide truncate">
                Homely Coins
              </h2>

              {showActionLink && (
                <Link
                  href="/wallet"
                  className="hidden sm:flex items-center gap-1 text-[11px] font-extrabold text-amber-300 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-xl border border-white/15 transition-all cursor-pointer shadow-xs shrink-0"
                >
                  <span>History</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            <p className="text-[12px] sm:text-[11px] text-emerald-200/80 font-medium leading-tight">
              1 Coin = ₹1 Discount Value
            </p>
          </div>

          {/* Balance Display */}
          <div className="mt-0.5">
            <span className="text-[12px] sm:text-[10px] font-extrabold text-emerald-300/80 uppercase tracking-widest block">
              Available Balance
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl sm:text-4xl font-black text-white font-poppins tracking-tight">
                {wallet?.balance ?? 0}
              </span>
              <span className="text-[11px] sm:text-sm font-bold text-amber-300">
                Coins (₹{wallet?.balance ?? 0})
              </span>
            </div>
          </div>

          {showActionLink && (
            <Link
              href="/wallet"
              className="flex sm:hidden items-center gap-1 text-[10px] font-extrabold text-amber-300 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-0.5 rounded-lg border border-white/15 transition-all cursor-pointer shadow-xs w-fit mt-0.5"
            >
              <span>Wallet History</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Bottom Summary Stats */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 z-10 text-xs">
        <div className="flex flex-col gap-0.5">
          <span className="text-emerald-200/70 block text-[10px] uppercase font-bold tracking-wider">
            Lifetime Earned
          </span>
          <span className="font-extrabold text-white text-xs sm:text-sm">+{wallet?.lifetimeEarned ?? 0} Coins</span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-emerald-200/70 block text-[10px] uppercase font-bold tracking-wider">
            Expired Coins
          </span>
          <span className="font-extrabold text-white text-xs sm:text-sm">-{wallet?.lifetimeExpired ?? 0} Coins</span>

          {/* Expire Badge - ONLY shows when expiring within 3 days */}
          {expiryInfo.shouldShow && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] sm:text-[10px] font-extrabold border border-amber-400/40 shadow-xs animate-pulse w-fit mt-1">
              <Clock className="w-3 h-3 text-amber-300 shrink-0" />
              <span>
                Expires in {expiryInfo.daysLeft} {expiryInfo.daysLeft === 1 ? "day" : "days"} ({expiryInfo.formattedDate})
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomelyCoinCard;

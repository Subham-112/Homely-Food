"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";

export default function FloatingOrderButton() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide on non-admin pages, admin login, or when already on the quick-order page
  if (
    !pathname ||
    !pathname.startsWith("/admin") ||
    pathname === "/admin/login" ||
    pathname === "/admin/quick-order"
  ) {
    return null;
  }

  return (
    <button
      onClick={() => router.push("/admin/quick-order")}
      className="fixed bottom-20 right-5 sm:right-6 z-[45] bg-[#0B392B] hover:bg-[#07281E] text-white font-extrabold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 cursor-pointer transition-all hover:scale-105 active:scale-95 group border border-emerald-700/40"
    >
      <div className="relative">
        <ShoppingBag className="w-5 h-5 group-hover:rotate-6 transition-transform" />
      </div>
      <span className="text-xs sm:text-sm tracking-wide">Order</span>
    </button>
  );
}

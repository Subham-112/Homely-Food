"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const PageSwitcher: React.FC = () => {
  const pathname = usePathname();

  const pages = [
    { name: "User Home", path: "/" },
    { name: "User Cart", path: "/cart" },
    { name: "User Orders", path: "/orders" },
    { name: "Admin Login", path: "/admin/login" },
    { name: "Admin Orders", path: "/admin/orders" },
    { name: "Admin Menu", path: "/admin/menu" },
    { name: "Admin Customers", path: "/admin/customers" },
    { name: "Admin Offers", path: "/admin/offers" },
    { name: "Admin Profile", path: "/admin/profile" },
  ];

  return (
    <div className="hidden sm:flex items-center gap-1.5 bg-[#0B392B] text-white p-2 rounded-full shadow-xl mb-3 border border-white/20 text-xs font-medium z-50 overflow-x-auto max-w-full no-scrollbar">
      <span className="px-2.5 text-emerald-300 font-bold uppercase tracking-wider text-[10px] whitespace-nowrap">
        Quick Preview:
      </span>
      {pages.map((p) => {
        const active = pathname === p.path || (p.path === "/admin/orders" && pathname === "/admin");
        return (
          <Link
            key={p.path}
            href={p.path}
            className={`px-3 py-1 rounded-full transition-all whitespace-nowrap text-[11px] ${
              active
                ? "bg-white text-[#0B392B] font-bold shadow-xs scale-105"
                : "hover:bg-white/10 text-emerald-100"
            }`}
          >
            {p.name}
          </Link>
        );
      })}
    </div>
  );
};

export default PageSwitcher;

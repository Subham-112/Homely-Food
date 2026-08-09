"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UtensilsCrossed, Utensils, Users, User } from "lucide-react";

export const AdminBottomNav: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/admin", icon: Home },
    { label: "Orders", href: "/admin/orders", icon: UtensilsCrossed },
    { label: "Menu", href: "/admin/menu", icon: Utensils },
    { label: "Customers", href: "/admin/customers", icon: Users },
    { label: "Profile", href: "/admin/profile", icon: User },
  ];

  return (
    <nav className="sticky bottom-0 z-40 bg-[#F4F9FA] border-t border-[#E1ECEE] shadow-lg">
      <div className="max-w-5xl w-full mx-auto px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          
          // Exact active check
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin" || pathname === "/admin/dashboard"
              : pathname === item.href;

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center gap-1 transition-colors relative flex-1"
            >
              {isActive ? (
                <div className="bg-[#0B392B] text-white py-1.5 px-4 rounded-full flex items-center justify-center shadow-xs">
                  <Icon className="w-4 h-4" />
                </div>
              ) : (
                <div className="p-1 text-gray-500 hover:text-[#0B392B] flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
              )}
              <span
                className={`text-[10px] font-semibold ${
                  isActive ? "text-[#0B392B] font-bold" : "text-gray-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default AdminBottomNav;

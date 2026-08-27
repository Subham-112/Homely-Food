"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UtensilsCrossed, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import CustomerReadyOrderAlert from "./CustomerReadyOrderAlert";

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { totalItems } = useCart();

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Orders", href: "/orders", icon: UtensilsCrossed },
    { label: "Cart", href: "/cart", icon: ShoppingCart, badge: totalItems },
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <>
      <CustomerReadyOrderAlert />
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#F4F9FA] border-t border-[#E1ECEE] shadow-lg">
        <div className="max-w-5xl w-full mx-auto px-4 py-1 flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center gap-1 transition-colors relative"
              >
                {isActive ? (
                  <div className="bg-[#0B392B] text-white p-2 rounded-lg flex items-center justify-center shadow-xs relative">
                    <Icon className="w-5 h-5" />
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-2 -right-2 bg-[#C51E1E] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="p-1 text-gray-500 hover:text-[#0B392B] flex items-center justify-center relative">
                    <Icon className="w-5 h-5" />
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#C51E1E] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
                <span
                  className={`text-[11px] font-medium ${
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
    </>
  );
};

export default BottomNav;

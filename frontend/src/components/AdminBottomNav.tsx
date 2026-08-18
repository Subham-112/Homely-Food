"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UtensilsCrossed, Utensils, Users, MoreHorizontal, User, Tag, CreditCard, LayoutGrid } from "lucide-react";
import AdminNewOrderAlert from "./AdminNewOrderAlert";

export const AdminBottomNav: React.FC = () => {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const navItems = [
    { label: "Home", href: "/admin", icon: Home },
    { label: "Orders", href: "/admin/orders", icon: UtensilsCrossed },
    { label: "Menu", href: "/admin/menu", icon: Utensils },
    { label: "Customers", href: "/admin/customers", icon: Users },
  ];

  const isMoreActive =
    pathname === "/admin/profile" ||
    pathname === "/admin/offers" ||
    pathname === "/admin/categories";

  return (
    <>
      <AdminNewOrderAlert />
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#F4F9FA] border-t border-[#E1ECEE] shadow-lg">
      {/* More Options Popover Overlay */}
      {showMore && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 bg-transparent z-40"
            onClick={() => setShowMore(false)}
          />
          <div className="absolute right-4 bottom-16 z-50 bg-white border border-[#E1ECEE] rounded-2xl shadow-xl py-2.5 min-w-[160px] flex flex-col gap-1 overflow-hidden">
            <Link
              href="/admin/payments"
              onClick={() => setShowMore(false)}
              className={`flex items-center gap-2.5 px-4 py-2 text-xs font-bold transition-colors ${
                pathname === "/admin/payments"
                  ? "bg-[#0B392B]/5 text-[#0B392B]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-[#0B392B]"
              }`}
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>Payments</span>
            </Link>
            <div className="h-[1px] bg-gray-100 mx-3" />
            <Link
              href="/admin/profile"
              onClick={() => setShowMore(false)}
              className={`flex items-center gap-2.5 px-4 py-2 text-xs font-bold transition-colors ${
                pathname === "/admin/profile"
                  ? "bg-[#0B392B]/5 text-[#0B392B]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-[#0B392B]"
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span>Profile</span>
            </Link>
            <div className="h-[1px] bg-gray-100 mx-3" />
            <Link
              href="/admin/offers"
              onClick={() => setShowMore(false)}
              className={`flex items-center gap-2.5 px-4 py-2 text-xs font-bold transition-colors ${
                pathname === "/admin/offers"
                  ? "bg-[#0B392B]/5 text-[#0B392B]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-[#0B392B]"
              }`}
            >
              <Tag className="w-4 h-4 shrink-0" />
              <span>Offers</span>
            </Link>
            <div className="h-[1px] bg-gray-100 mx-3" />
            <Link
              href="/admin/categories"
              onClick={() => setShowMore(false)}
              className={`flex items-center gap-2.5 px-4 py-2 text-xs font-bold transition-colors ${
                pathname === "/admin/categories"
                  ? "bg-[#0B392B]/5 text-[#0B392B]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-[#0B392B]"
              }`}
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span>Categories</span>
            </Link>
          </div>
        </>
      )}

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

        {/* More Button */}
        <button
          type="button"
          onClick={() => setShowMore((prev) => !prev)}
          className="flex flex-col items-center gap-1 transition-colors relative flex-1 cursor-pointer bg-transparent border-0 focus:outline-none"
        >
          {isMoreActive ? (
            <div className="bg-[#0B392B] text-white py-1.5 px-4 rounded-full flex items-center justify-center shadow-xs">
              <MoreHorizontal className="w-4 h-4" />
            </div>
          ) : (
            <div className="p-1 text-gray-500 hover:text-[#0B392B] flex items-center justify-center">
              <MoreHorizontal className="w-5 h-5" />
            </div>
          )}
          <span
            className={`text-[10px] font-semibold ${
              isMoreActive ? "text-[#0B392B] font-bold" : "text-gray-500"
            }`}
          >
            More
          </span>
        </button>
      </div>
    </nav>
    </>
  );
};

export default AdminBottomNav;

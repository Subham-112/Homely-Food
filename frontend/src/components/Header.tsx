"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, ShoppingCart, X, Home, Clock, User, ShieldCheck, Leaf, Utensils, LogOut, Tag, Coins, ArrowLeft } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useCoins } from "@/context/CoinContext";

export interface HeaderProps {
  showMenu?: boolean;
  showBack?: boolean;
  backHref?: string;
}

export const Header: React.FC<HeaderProps> = ({
  showMenu = true,
  showBack = false,
  backHref,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems } = useCart();
  const { user, isAuthenticated, isAdminAuthenticated, logout, adminLogout } = useAuth();
  const { wallet, floatingAnimation } = useCoins();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#F4F9FA] border-b border-[#E3EEF0] shadow-xs">
        <div className="max-w-7xl w-full mx-auto px-3 sm:px-5 flex items-center justify-between relative min-h-[56px]">
          {/* Left Side: Mobile Menu / Back Button */}
          <div className="flex items-center gap-3 z-10">
            {showMenu ? (
              <button
                onClick={() => setDrawerOpen(true)}
                className="p-1.5 text-[#0B392B] hover:bg-[#E3EEF0] rounded-xl transition-colors cursor-pointer"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            ) : showBack ? (
              <button
                onClick={() => (backHref ? router.push(backHref) : router.back())}
                className="p-1.5 text-[#0B392B] hover:bg-[#E3EEF0] rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                aria-label="Go back"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            ) : (
              <div className="w-8" />
            )}
          </div>

          {/* Middle Side: Centered Logo Image */}
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center text-center z-10">
            {isAdmin ? (
              <Link href="/admin" className="flex flex-col items-center">
                <span className="font-extrabold text-base sm:text-lg text-[#0B392B] tracking-tight font-poppins leading-tight">
                  Admin Panel
                </span>
              </Link>
            ) : (
              <Link href="/" className="flex items-center justify-center">
                <img
                  src="/Homely-foods-logo.png"
                  alt="Homely Foods - Pure Veg"
                  className="h-full sm:h-12 w-auto object-contain"
                />
              </Link>
            )}
          </div>

          {/* Right Side: Homely Coins Badge & Auth */}
          <div className="flex items-center gap-2 z-20 pr-2">
            {!isAdmin && isAuthenticated && (
              <Link
                href="/wallet"
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100/90 hover:bg-amber-200 text-amber-900 border border-amber-300/80 text-xs sm:text-sm font-extrabold transition cursor-pointer shadow-xs"
                title="Homely Coins Wallet"
              >
                <Coins className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-600 animate-pulse shrink-0" />
                <span>{wallet?.balance ?? 0}</span>

                {/* Upwards Floating Coin Animation Badge */}
                {floatingAnimation && (
                  <span
                    key={floatingAnimation.id}
                    className="absolute top-10 right-1 bg-emerald-600 text-white font-extrabold text-sm px-1.5 py-0.5 rounded-lg shadow-md animate-bounce border border-emerald-300 pointer-events-none"
                    style={{
                      animation: "floatUp 1.8s ease-out forwards",
                    }}
                  >
                    +{floatingAnimation.amount}
                  </span>
                )}
              </Link>
            )}

            {!isAdmin && (
              <div className="hidden md:flex items-center gap-2">
                {!isAuthenticated ? (
                  <>
                    <Link
                      href="/login"
                      className="text-xs font-bold text-[#0B392B] hover:bg-[#0B392B]/10 px-3 py-1.5 rounded-xl transition-all"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="text-xs font-bold bg-[#0B392B] text-white hover:bg-[#07281E] px-3.5 py-1.5 rounded-xl transition-all shadow-xs"
                    >
                      Sign Up
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={() => logout()}
                    className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Side Navigation Drawer Overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs bg-[#FAF6ED] h-full shadow-2xl z-10 flex flex-col p-5 overflow-y-auto justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                {!isAdmin && isAuthenticated && user ? (
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="w-9 h-9 rounded-full bg-[#0B392B] text-white flex items-center justify-center font-bold text-sm shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-extrabold text-sm text-[#0B251C] truncate font-poppins">
                      {user.name || "Customer"}
                    </span>
                  </div>
                ) : (
                  <span className="font-bold text-lg text-[#0B392B]">
                    {isAdmin ? "Admin Navigation" : "Navigation"}
                  </span>
                )}
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 text-gray-500 hover:text-black rounded-lg cursor-pointer shrink-0"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="mt-6 flex flex-col gap-2">
                {isAdmin ? (
                  <>
                    <Link
                      href="/admin"
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-[#0B392B] hover:text-white font-medium transition-colors"
                    >
                      <Home className="w-5 h-5" />
                      Dashboard / Overview
                    </Link>
                    <Link
                      href="/admin/orders"
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-[#0B392B] hover:text-white font-medium transition-colors"
                    >
                      <Clock className="w-5 h-5" />
                      Orders Management
                    </Link>
                    <Link
                      href="/admin/menu"
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-[#0B392B] hover:text-white font-medium transition-colors"
                    >
                      <Utensils className="w-5 h-5" />
                      Menu Management
                    </Link>
                    <Link
                      href="/admin/customers"
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-[#0B392B] hover:text-white font-medium transition-colors"
                    >
                      <User className="w-5 h-5" />
                      Customers
                    </Link>
                    <Link
                      href="/admin/categories"
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-[#0B392B] hover:text-white font-medium transition-colors"
                    >
                      <Tag className="w-5 h-5" />
                      Category Management
                    </Link>
                    {isAdminAuthenticated && (
                      <button
                        onClick={() => {
                          setDrawerOpen(false);
                          adminLogout();
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-colors w-full text-left cursor-pointer"
                      >
                        <LogOut className="w-5 h-5" />
                        Admin Logout
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <Link
                      href="/"
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-[#0B392B] hover:text-white font-medium transition-colors"
                    >
                      <Home className="w-5 h-5" />
                      Home & Menu
                    </Link>
                    <Link
                      href="/cart"
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-[#0B392B] hover:text-white font-medium transition-colors"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      My Cart ({totalItems})
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-[#0B392B] hover:text-white font-medium transition-colors"
                    >
                      <Clock className="w-5 h-5" />
                      My Orders
                    </Link>

                    {!isAuthenticated ? (
                      <>
                        <Link
                          href="/login"
                          onClick={() => setDrawerOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-[#0B392B] hover:text-white font-medium transition-colors"
                        >
                          <User className="w-5 h-5" />
                          User Login
                        </Link>
                        <Link
                          href="/signup"
                          onClick={() => setDrawerOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-[#0B392B] hover:text-white font-medium transition-colors"
                        >
                          <ShieldCheck className="w-5 h-5" />
                          Create Account
                        </Link>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setDrawerOpen(false);
                          logout();
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-colors w-full text-left cursor-pointer"
                      >
                        <LogOut className="w-5 h-5" />
                        Log Out
                      </button>
                    )}
                  </>
                )}
              </nav>
            </div>

            {/* Bottom Link for Admin Drawer */}
            {isAdmin && (
              <div className="pt-4 border-t border-gray-200 mt-auto">
                <Link
                  href="/"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:text-[#0B392B] hover:bg-[#0B392B]/5 transition-all"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Switch to Customer View</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;

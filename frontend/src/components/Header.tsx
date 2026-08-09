"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingCart, X, Home, Clock, User, ShieldCheck, Leaf, Lock, Utensils, LogOut } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { isAuthenticated, isAdminAuthenticated, logout, adminLogout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#F4F9FA] border-b border-[#E3EEF0] shadow-xs">
        <div className="max-w-7xl w-full mx-auto px-3 sm:px-5 py-2.5 flex items-center justify-between">
          {/* Left Side: Mobile Menu Button & Desktop Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden p-1.5 text-[#0B392B] hover:bg-[#E3EEF0] rounded-lg transition-colors cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo / Brand Name */}
            {isAdmin ? (
              <Link href="/admin" className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl text-[#0B392B] tracking-tight font-poppins leading-none">
                  Admin Panel
                </span>
              </Link>
            ) : (
              <Link href="/" className="flex items-center gap-2 group">
                <span className="font-extrabold text-lg sm:text-xl text-[#0B392B] tracking-tight font-poppins leading-none">
                  Homely Foods
                </span>
                <div className="pure-veg-ribbon">
                  <Leaf className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400" />
                  <span>PURE VEG</span>
                  <Leaf className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400 -scale-x-100" />
                </div>
              </Link>
            )}
          </div>

          {/* Right Side Cart & Auth Buttons */}
          <div className="flex items-center gap-3">
            {!isAdmin && (
              <Link
                href="/cart"
                className="relative p-2 text-[#0B392B] hover:bg-[#E3EEF0] rounded-xl transition-colors flex items-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="hidden md:inline text-xs font-bold">Cart</span>
                {totalItems > 0 && (
                  <span className="bg-[#C51E1E] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center">
                    {totalItems}
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
                      className="text-xs font-bold text-[#0B392B] hover:bg-[#0B392B]/10 px-3.5 py-2 rounded-xl transition-all"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="text-xs font-bold bg-[#0B392B] text-white hover:bg-[#07281E] px-4 py-2 rounded-xl transition-all shadow-xs"
                    >
                      Sign Up
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={() => logout()}
                    className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition-all cursor-pointer"
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
                <span className="font-bold text-lg text-[#0B392B]">
                  {isAdmin ? "Admin Navigation" : "Navigation"}
                </span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 text-gray-500 hover:text-black rounded-lg cursor-pointer"
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

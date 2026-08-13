"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Phone, Mail, Edit3, ShoppingBag, Clock, LogOut, ShieldCheck, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Button from "@/components/Button";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#FAF6ED] relative">
      {/* Fixed Top Header */}
      <Header />

      {/* Middle Scrollable Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 sm:p-5 max-w-2xl w-full mx-auto flex flex-col gap-4 pb-24">
        {/* Page Title */}
        <div className="flex items-center justify-between px-0.5">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B251C] font-poppins">
            My Profile
          </h1>
        </div>

        {!isAuthenticated || !user ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#E8E1D3] flex flex-col items-center justify-center gap-4 shadow-xs my-4">
            <div className="w-16 h-16 rounded-full bg-[#FAF6ED] flex items-center justify-center text-[#0B392B]">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0B251C]">Please Log In</h2>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                Log in to your Homely Foods account to view your profile details and track your orders.
              </p>
            </div>
            <Button
              variant="primary"
              fullWidth={false}
              onClick={() => router.push("/login")}
            >
              Go to Login
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Main User Card */}
            <div className="bg-white rounded-3xl p-5 border border-[#E8E1D3] shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-4">
                {/* User Avatar Circle */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0B392B] to-[#145C47] text-white font-extrabold text-2xl flex items-center justify-center shadow-md shrink-0">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] font-poppins truncate">
                      {user.name || "Homely Customer"}
                    </h2>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider shrink-0">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                    {user.phone ? `+91 ${user.phone}` : "No phone attached"}
                  </p>
                </div>

                {/* Edit Profile Button */}
                <Link
                  href="/profile/edit"
                  className="p-2.5 bg-[#FAF6ED] hover:bg-[#0B392B]/10 text-[#0B392B] border border-[#0B392B]/20 rounded-2xl transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-2xs"
                  title="Edit Profile"
                >
                  <Edit3 className="w-4.5 h-4.5" />
                </Link>
              </div>

              {/* Profile Information List */}
              <div className="grid grid-cols-1 gap-2 pt-3 border-t border-gray-100 text-xs sm:text-sm">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/70 border border-gray-100">
                  <div className="flex items-center gap-2.5 text-gray-600 font-medium">
                    <Phone className="w-4 h-4 text-[#0B392B]" />
                    <span>Mobile Number</span>
                  </div>
                  <span className="font-bold text-[#0B251C]">{user.phone || "N/A"}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/70 border border-gray-100">
                  <div className="flex items-center gap-2.5 text-gray-600 font-medium">
                    <Mail className="w-4 h-4 text-[#0B392B]" />
                    <span>Email Address</span>
                  </div>
                  <span className="font-bold text-[#0B251C] truncate max-w-[180px]">
                    {user.email || "Not specified"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions List */}
            <div className="bg-white rounded-3xl p-3 border border-[#E8E1D3] shadow-xs flex flex-col gap-1">
              <Link
                href="/orders"
                className="flex items-center justify-between p-3.5 hover:bg-gray-50 rounded-2xl transition-colors text-xs sm:text-sm font-bold text-[#0B251C]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0B392B]/10 text-[#0B392B] flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span>My Orders</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link
                href="/cart"
                className="flex items-center justify-between p-3.5 hover:bg-gray-50 rounded-2xl transition-colors text-xs sm:text-sm font-bold text-[#0B251C]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0B392B]/10 text-[#0B392B] flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <span>My Cart</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link
                href="/profile/edit"
                className="flex items-center justify-between p-3.5 hover:bg-gray-50 rounded-2xl transition-colors text-xs sm:text-sm font-bold text-[#0B251C]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0B392B]/10 text-[#0B392B] flex items-center justify-center">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <span>Edit Profile Details</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>

            {/* Logout Action */}
            <div className="bg-white rounded-3xl p-3 border border-[#E8E1D3] shadow-xs">
              <button
                onClick={() => logout()}
                className="w-full flex items-center justify-between p-3.5 hover:bg-red-50 text-red-600 rounded-2xl transition-colors text-xs sm:text-sm font-extrabold cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span>Log Out of Account</span>
                </div>
                <ChevronRight className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

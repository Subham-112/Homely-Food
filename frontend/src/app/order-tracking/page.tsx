"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  FileCheck,
  CookingPot,
  ShoppingBag,
  Check,
  UserPlus,
  Compass,
} from "lucide-react";
import VegBadge from "@/components/VegBadge";
import Button from "@/components/Button";
import { useCart } from "@/context/CartContext";

export default function OrderTrackingPage() {
  const { currentOrder } = useCart();

  const displayOrder = currentOrder || {
    id: "#HF1024",
    totalAmount: 350,
    items: [
      { name: "Homestyle Rajma Chawal", quantity: 1, price: 180 },
      { name: "Paneer Butter Masala Combo", quantity: 1, price: 170 },
    ],
  };

  const steps = [
    {
      title: "Accepted",
      time: "12:30 PM",
      status: "completed",
      icon: FileCheck,
    },
    {
      title: "Preparing",
      time: "Estimated: 12:45 PM",
      status: "current",
      icon: CookingPot,
    },
    {
      title: "Ready",
      time: "--:--",
      status: "upcoming",
      icon: ShoppingBag,
    },
    {
      title: "Completed",
      time: "--:--",
      status: "upcoming",
      icon: Check,
    },
  ];

  return (
    <div className="flex-1 bg-[#FAF6ED] p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto pb-10">
      {/* Order Placed Success Banner */}
      <div className="bg-[#0B392B] text-white rounded-2xl p-4 flex items-center gap-3 shadow-md shrink-0">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
        </div>
        <h1 className="text-lg font-bold tracking-tight">
          Order Placed Successfully! 🎉
        </h1>
      </div>

      {/* Order Number & Total Card */}
      <div className="bg-[#F0F8FF] rounded-2xl p-4 border border-[#D8EDFC] flex items-center justify-between shrink-0">
        <div>
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            ORDER NUMBER
          </span>
          <span className="text-base font-extrabold text-[#0B251C]">
            {displayOrder.id}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            TOTAL AMOUNT
          </span>
          <span className="text-lg font-extrabold text-[#0B251C]">
            ₹{displayOrder.totalAmount}
          </span>
        </div>
      </div>

      {/* Tracking Order Container */}
      <div className="bg-[#EBF5FC] rounded-2xl p-5 border border-[#D6EBFB] shrink-0">
        <h2 className="text-base font-bold text-[#0B251C] mb-5">
          Tracking Order
        </h2>

        <div className="flex flex-col gap-6 relative pl-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = step.status === "completed";
            const isCurrent = step.status === "current";
            const isUpcoming = step.status === "upcoming";
            const isLast = idx === steps.length - 1;

            return (
              <div key={step.title} className="relative flex items-start gap-4 z-10">
                {/* Connecting Line */}
                {!isLast && (
                  <div
                    className={`absolute left-5 top-10 bottom-0 w-[2px] -mb-6 ${
                      isCompleted ? "bg-[#0B392B]" : "bg-[#D0E2EE]"
                    }`}
                  />
                )}

                {/* Circle Icon */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 ${
                    isCompleted
                      ? "bg-[#0B392B] border-[#0B392B] text-white"
                      : isCurrent
                      ? "bg-white border-[#0B392B] text-[#0B392B]"
                      : "bg-[#E2EFF7] border-[#D0E2EE] text-gray-400"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Text Details */}
                <div className="pt-0.5">
                  <h3
                    className={`text-sm font-bold ${
                      isUpcoming ? "text-gray-400" : "text-[#0B251C]"
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p
                    className={`text-xs ${
                      isUpcoming ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {step.time}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Summary Card */}
      <div className="bg-[#F8FCFF] rounded-2xl p-4 border border-[#E1EEF6] shrink-0">
        <h2 className="text-base font-bold text-[#0B251C] mb-3 border-b border-gray-100 pb-2">
          Order Summary
        </h2>
        <div className="flex flex-col gap-2.5">
          {displayOrder.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-800">
                <VegBadge size={16} />
                <span className="font-medium">
                  {item.name} x {item.quantity}
                </span>
              </div>
              <span className="font-bold text-[#0B251C]">
                ₹{item.price * item.quantity}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Account Creation Prompt Box */}
      <div className="bg-[#EBF5FC] rounded-2xl p-5 border border-[#D6EBFB] flex flex-col items-center text-center gap-3 shrink-0">
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#0B392B] shadow-xs">
          <UserPlus className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-gray-800 leading-snug px-2">
          Want to keep track of your orders easily? Create a Homely Foods account.
        </p>
        <div className="w-full flex flex-col gap-2 mt-1">
          <Link href="/signup" className="w-full">
            <Button variant="primary">Create Account</Button>
          </Link>
          <Link href="/orders" className="text-xs font-semibold text-[#0B392B] py-2 hover:underline">
            View All My Orders
          </Link>
        </div>
      </div>

      {/* Bottom Action Links */}
      <div className="flex flex-col gap-3 items-center mt-1 shrink-0">
        <Link href="/orders" className="w-full">
          <Button variant="outline" icon={Compass} iconPosition="left">
            View My Orders
          </Button>
        </Link>
        <Link href="/" className="text-xs font-bold text-gray-600 hover:text-[#0B392B]">
          Continue Browsing
        </Link>
      </div>
    </div>
  );
}

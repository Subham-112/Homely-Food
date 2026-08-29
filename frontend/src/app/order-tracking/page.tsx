"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  FileCheck,
  CookingPot,
  ShoppingBag,
  Check,
  UserPlus,
  Compass,
  Loader2,
  Sparkles,
  Flame,
  PackageCheck,
} from "lucide-react";
import VegBadge from "@/components/VegBadge";
import Button from "@/components/Button";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { getOrderById } from "@/services/orderService";
import { useSocket } from "@/context/SocketContext";

function OrderTrackingContent() {
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get("orderId") || searchParams.get("id") || searchParams.get("order");
  const { currentOrder } = useCart();
  const { user } = useAuth();
  const { socket, joinOrderRoom, leaveOrderRoom } = useSocket();

  const [liveOrder, setLiveOrder] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(!!orderIdParam);

  // Real-time socket status updates
  useEffect(() => {
    if (orderIdParam) {
      joinOrderRoom(orderIdParam);
    }

    if (!socket) return;

    const handleStatusUpdate = (updatedOrder: any) => {
      console.log("📢 Socket Event in User Order Tracking:", updatedOrder);
      if (
        updatedOrder.orderNumber === orderIdParam ||
        updatedOrder._id === orderIdParam ||
        updatedOrder.id === orderIdParam
      ) {
        setLiveOrder((prev: any) => ({
          ...(prev || {}),
          ...updatedOrder,
        }));
      }
    };

    socket.on("order:status_updated", handleStatusUpdate);

    return () => {
      if (orderIdParam) {
        leaveOrderRoom(orderIdParam);
      }
      socket.off("order:status_updated", handleStatusUpdate);
    };
  }, [socket, orderIdParam]);

  useEffect(() => {
    const fetchLiveOrder = async () => {
      if (orderIdParam) {
        setLoading(true);
        try {
          const found = await getOrderById(orderIdParam);
          if (found) {
            setLiveOrder(found);
          }
        } catch (err) {
          console.error("Failed to fetch order tracking details:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchLiveOrder();
  }, [orderIdParam]);

  const displayOrder = liveOrder || currentOrder;

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-gray-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B392B]" />
        <span className="text-xs font-semibold">Fetching real-time order status...</span>
      </div>
    );
  }

  if (!displayOrder) {
    return (
      <div className="flex-1 bg-[#FAF6ED] p-6 flex flex-col items-center justify-center text-center gap-4 max-w-md mx-auto my-12 rounded-3xl border border-gray-100 shadow-2xs">
        <ShoppingBag className="w-12 h-12 text-gray-300" />
        <h2 className="text-lg font-bold text-[#0B251C]">No Active Order Found</h2>
        <p className="text-xs text-gray-500">
          You haven't placed an active order yet. Browse our menu to order fresh homestyle meals!
        </p>
        <Link href="/">
          <Button variant="primary">Browse Menu</Button>
        </Link>
      </div>
    );
  }

  const statusLower = (displayOrder.status || "preparing").toLowerCase();

  // Airtight Step State Computation (completed vs current vs upcoming)
  const getStepState = (stepKey: "accepted" | "preparing" | "ready" | "completed") => {
    const isAllCompleted = statusLower === "completed" || statusLower === "delivered";

    if (isAllCompleted) {
      return "completed"; // Every step is 100% DONE! Solid dark green checkmark ✔️
    }

    const orderIndexMap: Record<string, number> = {
      pending: 0,
      accepted: 0,
      preparing: 1,
      ready: 2,
      cancelled: -1,
    };

    const stepIndexMap: Record<string, number> = {
      accepted: 0,
      preparing: 1,
      ready: 2,
      completed: 3,
    };

    const currentOrderStep = orderIndexMap[statusLower] ?? 0;
    const targetStepIndex = stepIndexMap[stepKey];

    if (currentOrderStep > targetStepIndex) {
      return "completed"; // Past step -> Show Checkmark ✔️
    }
    if (currentOrderStep === targetStepIndex) {
      return "current"; // Active step running right now -> Highlighted & Animated 🔥
    }
    return "upcoming"; // Future step -> Muted ⏳
  };

  // Dynamic Banner Info & Distinct Background Colors per Status
  const getBannerInfo = () => {
    switch (statusLower) {
      case "accepted":
      case "pending":
        return {
          title: "Order Accepted! 🎉",
          subtitle: "Your order has been confirmed by the kitchen.",
          icon: CheckCircle2,
          bgColor: "bg-gradient-to-r from-[#0B392B] to-[#12503d]",
          badgeText: "ACCEPTED",
          containerStyle: "bg-[#EBF5FC] border-[#D6EBFB]",
        };
      case "preparing":
        return {
          title: "Chef is Cooking! 🍳",
          subtitle: "Your delicious meal is currently being freshly prepared.",
          icon: Flame,
          bgColor: "bg-gradient-to-r from-amber-700 via-orange-800 to-amber-900 border border-amber-400/30",
          badgeText: "PREPARING NOW",
          containerStyle: "bg-[#FFFDF5] border-[#FBEEC8]",
        };
      case "ready":
        return {
          title: "Your Order is Prepared & Ready! 🍱",
          subtitle: "Your food is hot & ready for pickup / serving!",
          icon: PackageCheck,
          bgColor: "bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 border border-emerald-400/40 animate-pulse",
          badgeText: "READY FOR PICKUP",
          containerStyle: "bg-[#F0FAF5] border-[#C8EFE0]",
        };
      case "completed":
      case "delivered":
        return {
          title: "Order Completed! 🥳",
          subtitle: "Thank you for ordering with Homely Foods! Enjoy your meal.",
          icon: Sparkles,
          bgColor: "bg-gradient-to-r from-[#0B392B] via-emerald-800 to-teal-900 border-2 border-emerald-400/40",
          badgeText: "ORDER FULFILLED",
          containerStyle: "bg-[#EFF9F3] border-[#B7E8CE]",
        };
      case "cancelled":
        return {
          title: "Order Cancelled ❌",
          subtitle: "This order has been cancelled.",
          icon: CheckCircle2,
          bgColor: "bg-gradient-to-r from-rose-800 to-red-900 border border-rose-400/40",
          badgeText: "CANCELLED",
          containerStyle: "bg-rose-50 border-rose-200",
        };
      default:
        return {
          title: "Order Placed Successfully! 🎉",
          subtitle: "Your delicious home food is on its way!",
          icon: CheckCircle2,
          bgColor: "bg-[#0B392B]",
          badgeText: "IN PROGRESS",
          containerStyle: "bg-[#EBF5FC] border-[#D6EBFB]",
        };
    }
  };

  const banner = getBannerInfo();
  const isFullyCompleted = statusLower === "completed" || statusLower === "delivered";

  const steps = [
    {
      key: "accepted",
      title: "Accepted",
      state: getStepState("accepted"),
      icon: FileCheck,
      description:
        statusLower === "accepted" || statusLower === "pending"
          ? "Order confirmed! Kitchen is getting ready."
          : "Order Accepted & Confirmed",
    },
    {
      key: "preparing",
      title: "Preparing Food",
      state: getStepState("preparing"),
      icon: CookingPot,
      description:
        statusLower === "preparing"
          ? "Your order is being cooked right now with fresh ingredients!"
          : getStepState("preparing") === "completed"
          ? "Your order has been freshly cooked & prepared."
          : "Cooking meal (Estimated 15-20 mins)",
    },
    {
      key: "ready",
      title: "Order Prepared & Ready",
      state: getStepState("ready"),
      icon: ShoppingBag,
      description:
        statusLower === "ready"
          ? "Your order is prepared and ready for serving / pickup!"
          : getStepState("ready") === "completed"
          ? "Order prepared & packed."
          : "Ready for serving or dispatch",
    },
    {
      key: "completed",
      title: "Completed",
      state: getStepState("completed"),
      icon: CheckCircle2,
      description:
        isFullyCompleted
          ? "Order fulfilled & delivered successfully! Enjoy your meal!"
          : "Order fulfillment",
    },
  ];

  return (
    <div className="flex-1 bg-[#FAF6ED] p-4 sm:p-6 lg:p-8 flex flex-col gap-2 overflow-y-auto max-w-4xl w-full mx-auto pb-16">
      {/* Dynamic Order Status Banner */}
      <div className={`${banner.bgColor} text-white rounded-2xl p-4 flex items-center justify-between shadow-md shrink-0 transition-all duration-300`}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <banner.icon className="w-6 h-6 text-emerald-300 animate-bounce" />
          </div>
          <div>
            <h1 className="font-extrabold tracking-tight text-base sm:text-lg">
              {banner.title}
            </h1>
            <p className="text-xs text-emerald-100 font-medium mt-0.5">
              {banner.subtitle}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-extrabold px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white tracking-wider uppercase shrink-0 hidden sm:inline-block">
          {banner.badgeText}
        </span>
      </div>

      {/* Order Number & Total Card */}
      <div className="bg-[#F0F8FF] rounded-2xl p-5 border border-[#D8EDFC] flex items-center justify-between shrink-0">
        <div>
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            ORDER NUMBER
          </span>
          <span className="text-base sm:text-lg font-extrabold text-[#0B251C]">
            {displayOrder.orderNumber || displayOrder._id || displayOrder.id}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            TOTAL AMOUNT
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-[#0B251C]">
            ₹{displayOrder.payment.totalAmount}
          </span>
        </div>
      </div>

      {/* Grid section for Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
        {/* Tracking Order Container */}
        <div className={`${banner.containerStyle} rounded-2xl p-4 border shrink-0 transition-all duration-300`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[#0B251C]">
              Live Order Progress
            </h2>
            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live Socket
            </span>
          </div>

          <div className="flex flex-col gap-4 relative">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = step.state === "completed";
              const isCurrent = step.state === "current";
              const isLast = idx === steps.length - 1;

              return (
                <div
                  key={step.title}
                  className={`relative flex items-center gap-3.5 z-10 transition-all duration-300 ${
                    isCurrent
                      ? "bg-white p-3 rounded-2xl border-y border-r border-gray-200/80 shadow-md -mx-1"
                      : "p-1.5"
                  }`}
                >
                  {/* Connecting Line */}
                  {!isLast && (
                    <div
                      className={`absolute ${isCurrent ? 'left-6 top-10' : "left-5 top-8"} bottom-0 w-[2px] -mb-6 transition-colors duration-500 ${
                        isCompleted || isFullyCompleted ? "bg-[#0B392B]" : "bg-[#D0E2EE]"
                      }`}
                    />
                  )}

                  {/* Icon Circle */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300 ${
                      isCompleted
                        ? "bg-[#0B392B] border-[#0B392B] text-white shadow-xs"
                        : isCurrent
                        ? "bg-[#0B392B] border-[#0B392B] text-white shadow-lg ring-4 ring-[#0B392B]/20 scale-105"
                        : "bg-[#E2EFF7] border-[#D0E2EE] text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 text-white stroke-[3]" />
                    ) : (
                      <Icon className={`w-4 h-4 ${isCurrent ? "animate-pulse text-amber-300" : ""}`} />
                    )}
                  </div>

                  {/* Text Details & Badges */}
                  <div className="pt-0.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <h3
                        className={`text-sm font-extrabold ${
                          isCompleted
                            ? "text-[#0B392B]"
                            : isCurrent
                            ? "text-[#0B251C]"
                            : "text-gray-400"
                        }`}
                      >
                        {step.title}
                      </h3>

                      {isCurrent && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#0B392B] text-white tracking-wider uppercase animate-pulse">
                          RUNNING NOW ⚡
                        </span>
                      )}

                      {isCompleted && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> Done
                        </span>
                      )}
                    </div>

                    <p
                      className={`text-xs mt-0.5 font-medium leading-tight ${
                        isCurrent
                          ? "text-[#0B392B] font-semibold"
                          : isCompleted
                          ? "text-gray-600"
                          : "text-gray-400"
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right side summary & action prompts */}
        <div className="flex flex-col gap-5">
          {/* Order Summary Card */}
          <div className="bg-[#F8FCFF] rounded-2xl p-5 border border-[#E1EEF6] shrink-0">
            <h2 className="text-base font-bold text-[#0B251C] mb-3 border-b border-gray-100 pb-2">
              Order Summary
            </h2>
            <div className="flex flex-col gap-3">
              {(displayOrder.items || []).map((item: any, idx: number) => {
                const unitPrice = item.price ?? item.menuItem?.discountedPrice ?? item.menuItem?.price ?? 0;
                return (
                  <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center gap-2 text-gray-800 min-w-0 pr-2">
                      <VegBadge size={16} />
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">
                          {item.menuItem?.name || item.name || "Dish"} x {item.quantity}
                        </span>
                        {item.variant?.label && (
                          <span className="text-[10px] text-gray-500 font-semibold">
                            Variant: {item.variant.label}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-[#0B251C] shrink-0">
                      ₹{unitPrice * item.quantity}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Account Creation Prompt Box for Guest */}
          {!user && (
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
              </div>
            </div>
          )}

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
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={
      <div className="py-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B392B]" />
      </div>
    }>
      <OrderTrackingContent />
    </Suspense>
  );
}

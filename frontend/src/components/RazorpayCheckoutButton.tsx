"use client";

import React, { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { verifyPayment } from "@/services/paymentService";
import { openRazorpaySDK } from "@/utils/razorpayHelper";

interface RazorpayCheckoutButtonProps {
  checkoutSession: {
    requiresPayment: boolean;
    razorpayOrderId: string;
    amount: number;
    currency: string;
    key: string;
    paymentId: string;
  };
  onSuccess: (order: any) => void;
  onFailure?: (error: any) => void;
  buttonText?: string;
  className?: string;
}

export const RazorpayCheckoutButton: React.FC<RazorpayCheckoutButtonProps> = ({
  checkoutSession,
  onSuccess,
  onFailure,
  buttonText = "Pay Online",
  className = "",
}) => {
  const [loading, setLoading] = useState(false);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") {
        resolve(false);
        return;
      }
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      await openRazorpaySDK(
        checkoutSession,
        (order) => {
          setLoading(false);
          onSuccess(order);
        },
        (err) => {
          setLoading(false);
          if (onFailure) onFailure(err);
        },
        () => {
          setLoading(false);
        }
      );
    } catch (err) {
      console.error("Error opening Razorpay checkout:", err);
      if (onFailure) onFailure(err);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className={
        className ||
        "w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50"
      }
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Processing Payment...</span>
        </>
      ) : (
        <>
          <CreditCard className="w-5 h-5" />
          <span>{buttonText} (₹{checkoutSession.amount})</span>
        </>
      )}
    </button>
  );
};

export default RazorpayCheckoutButton;

import React from "react";

interface PaymentStatusBadgeProps {
  status: string;
  className?: string;
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status, className = "" }) => {
  const normalized = (status || "").toLowerCase();

  let badgeStyle = "bg-gray-100 text-gray-800 border-gray-300";
  let label = status || "Unknown";

  switch (normalized) {
    case "paid":
      badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
      label = "Paid";
      break;
    case "pending":
    case "created":
    case "attempted":
      badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
      label = "Pending";
      break;
    case "failed":
      badgeStyle = "bg-rose-50 text-rose-700 border-rose-200";
      label = "Failed";
      break;
    case "refunded":
      badgeStyle = "bg-purple-50 text-purple-700 border-purple-200";
      label = "Refunded";
      break;
    case "partially_refunded":
      badgeStyle = "bg-indigo-50 text-indigo-700 border-indigo-200";
      label = "Partial Refund";
      break;
    case "expired":
      badgeStyle = "bg-gray-100 text-gray-500 border-gray-200";
      label = "Expired";
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyle} ${className}`}
    >
      {label}
    </span>
  );
};

export default PaymentStatusBadge;

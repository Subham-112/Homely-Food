"use client";

import React from "react";
import AdminBottomNav from "@/components/AdminBottomNav";
import QuickOrderWizard from "@/components/QuickOrderWizard";

export default function AdminCreateOrderPage() {
  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#FAF6ED] relative">
      {/* Quick Order Wizard Container */}
      <QuickOrderWizard isStandalonePage={true} />

      {/* Pinned Bottom Nav */}
      <AdminBottomNav />
    </div>
  );
}

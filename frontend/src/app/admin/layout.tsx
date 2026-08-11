"use client";

import React from "react";
import FloatingOrderButton from "@/components/FloatingOrderButton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <FloatingOrderButton />
    </>
  );
}

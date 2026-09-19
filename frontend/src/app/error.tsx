"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Error Boundary caught error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 mb-4 shadow-xs">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-[#0B392B] mb-2 font-poppins">
        Something went wrong
      </h2>
      <p className="text-sm text-gray-600 max-w-md mb-6">
        We encountered an unexpected issue while loading this view. You can try reloading or return to the home page.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B392B] hover:bg-[#0B392B]/90 text-white font-medium text-sm transition cursor-pointer shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
        <button
          onClick={() => {
            window.location.href = "/";
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-[#0B392B] border border-gray-200 font-medium text-sm transition cursor-pointer shadow-xs"
        >
          <Home className="w-4 h-4" />
          Go to Home
        </button>
      </div>
    </div>
  );
}

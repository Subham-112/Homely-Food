"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Layout Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "sans-serif", backgroundColor: "#FAF6ED", color: "#0B392B" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", textAlign: "center" }}>
          <div style={{ backgroundColor: "#FEF3C7", padding: "16px", borderRadius: "16px", marginBottom: "16px" }}>
            ⚠️
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: "14px", color: "#4B5563", maxWidth: "400px", marginBottom: "24px" }}>
            An unexpected error occurred while rendering the page.
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => reset()}
              style={{
                backgroundColor: "#0B392B",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "10px",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => {
                window.location.href = "/";
              }}
              style={{
                backgroundColor: "#FFFFFF",
                color: "#0B392B",
                border: "1px solid #D1D5DB",
                borderRadius: "10px",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Go to Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

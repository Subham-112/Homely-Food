"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Utensils, Mail, Lock, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { Fetch, Post } from "@/utils/api";

export default function AdminForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 states
  const [email, setEmail] = useState("");
  const [loadingStep1, setLoadingStep1] = useState(false);
  const [errorStep1, setErrorStep1] = useState("");

  // Step 2 states
  const [newPassword, setNewPassword] = useState("");
  const [loadingStep2, setLoadingStep2] = useState(false);
  const [errorStep2, setErrorStep2] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Step 1: Verify email address via /api/admin/is-email-exists
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStep1("");
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setErrorStep1("Please enter your registered email address.");
      return;
    }

    setLoadingStep1(true);
    try {
      const res = await Fetch<{ success: boolean; data?: { exists: boolean }; message?: string }>(
        `/api/admin/is-email-exists?email=${encodeURIComponent(trimmedEmail)}`
      );

      if (res?.data?.exists === true) {
        setStep(2);
      } else {
        setErrorStep1("Email address not registered as an admin.");
      }
    } catch (err: any) {
      console.error("is-email-exists check failed:", err);
      setErrorStep1(err?.message || "Admin not found with this email address.");
    } finally {
      setLoadingStep1(false);
    }
  };

  // Step 2: Reset password via /api/admin/reset-password
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStep2("");

    if (!newPassword || newPassword.length < 6) {
      setErrorStep2("Password must be at least 6 characters long.");
      return;
    }

    setLoadingStep2(true);
    try {
      const res = await Post<{ success: boolean; message: string }>("/api/admin/reset-password", {
        email: email.trim().toLowerCase(),
        newPassword: newPassword,
      });

      if (res?.success) {
        setSuccessMsg("Admin password reset successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/admin/login");
        }, 2000);
      } else {
        setErrorStep2(res?.message || "Failed to reset password. Please try again.");
      }
    } catch (err: any) {
      console.error("Admin reset password failed:", err);
      setErrorStep2(err?.message || "Failed to reset password. Please try again.");
    } finally {
      setLoadingStep2(false);
    }
  };

  return (
    <div className="flex-1 bg-[#F4F8FA] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 h-screen">
      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-xl border border-[#E8F0F2] p-6 sm:p-8 flex flex-col items-center relative">
        {/* Header Back Arrow */}
        <div className="w-full flex items-center justify-between mb-4">
          <Link
            href="/admin/login"
            className="p-2 text-[#0B392B] hover:bg-emerald-50 rounded-xl transition-colors shrink-0"
            title="Back to Admin Login"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-xs font-bold text-gray-400">Step {step} of 2</span>
        </div>

        {/* Logo Badge */}
        <div className="w-14 h-14 rounded-2xl bg-[#0B392B] flex items-center justify-center shadow-md mb-3 shrink-0">
          <Utensils className="w-7 h-7 text-white" />
        </div>

        {/* Page Titles */}
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B251C] text-center font-poppins tracking-tight">
          Admin Password Reset
        </h1>
        <p className="text-xs text-gray-500 text-center mt-1 mb-6">
          {step === 1 ? "Enter your admin email address to proceed." : "Set a new admin password."}
        </p>

        {/* Sliding Form Container */}
        <div className="w-full overflow-hidden relative">
          <div
            className={`flex w-[200%] transition-transform duration-500 ease-in-out ${
              step === 2 ? "-translate-x-1/2" : "translate-x-0"
            }`}
          >
            {/* --- SLIDE 1: Email Verification --- */}
            <div className="w-1/2 pr-2 shrink-0">
              {errorStep1 && (
                <div className="w-full bg-red-50 text-red-600 text-xs font-semibold p-3 rounded-xl border border-red-200 mb-4 text-center">
                  {errorStep1}
                </div>
              )}

              <form onSubmit={handleStep1Submit} className="w-full flex flex-col gap-4">
                <Input
                  label="Admin Email Address"
                  icon={Mail}
                  type="email"
                  placeholder="admin@homelyfoods.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <div className="mt-2">
                  <Button type="submit" variant="primary" icon={ArrowRight} iconPosition="right" disabled={loadingStep1}>
                    {loadingStep1 ? "Verifying..." : "Continue"}
                  </Button>
                </div>
              </form>
            </div>

            {/* --- SLIDE 2: New Password Entry --- */}
            <div className="w-1/2 pl-2 shrink-0">
              {/* Display Admin Email at Top */}
              <div className="bg-[#FAF6ED] border border-[#E8E1D3] p-3 rounded-xl text-center mb-4 text-xs">
                <span className="text-gray-500 font-medium">Admin Email: </span>
                <span className="font-bold text-[#0B251C]">{email}</span>
              </div>

              {errorStep2 && (
                <div className="w-full bg-red-50 text-red-600 text-xs font-semibold p-3 rounded-xl border border-red-200 mb-4 text-center">
                  {errorStep2}
                </div>
              )}

              {successMsg && (
                <div className="w-full bg-emerald-50 text-emerald-700 text-xs font-bold p-3 rounded-xl border border-emerald-200 mb-4 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleStep2Submit} className="w-full flex flex-col gap-4">
                <Input
                  label="New Password"
                  icon={Lock}
                  isPassword
                  placeholder="Enter new password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />

                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors"
                  >
                    Back
                  </button>
                  <Button type="submit" variant="primary" disabled={loadingStep2 || !!successMsg}>
                    {loadingStep2 ? "Saving..." : "Save Password"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-xs text-gray-500 text-center mt-6">
          Remembered your password?{" "}
          <Link href="/admin/login" className="font-bold text-[#0B392B] hover:underline">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

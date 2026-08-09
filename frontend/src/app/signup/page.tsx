"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Utensils, User, Smartphone, Lock } from "lucide-react";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Post } from "@/utils/api";

interface RegisterApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      name: string;
      phone: string;
      email?: string;
      role: string;
      status: string;
      avatar?: string;
    };
    accessToken: string;
  };
}

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!agreed) {
      setErrorMsg("Please agree to the Terms & Conditions and Privacy Policy.");
      return;
    }

    setLoading(true);

    try {
      // Call backend API viaNext.js proxy route /api/user/register
      const res = await Post<RegisterApiResponse>(
        "/api/user/register",
        {
          name: fullName,
          phone: mobileNumber,
          password: password,
        }
      );

      const token =
        (res as any)?.data?.accessToken ||
        (res as any)?.accessToken ||
        (res as any)?.token ||
        (res as any)?.data?.token;

      if (token) {
        signup(token);
      } else {
        // Upon successful registration without direct auto-login token, navigate to /login page
        router.replace("/login");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      // If registration fails with specific API error message, display it; otherwise navigate to login page
      if (err?.message && typeof err.message === "string" && !err.message.includes("Network")) {
        setErrorMsg(err.message);
      } else {
        // Redirect to login page
        router.replace("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-[#FAF6ED] p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-lg border border-[#EFE9DA]/60 flex flex-col items-center my-auto">
        {/* Top Logo Icon */}
        <div className="w-16 h-16 rounded-full bg-[#EAF5EE] flex items-center justify-center mb-6 shrink-0">
          <Utensils className="w-8 h-8 text-[#0B392B]" />
        </div>

        {/* Header Text */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B251C] text-center tracking-tight font-poppins mb-2">
          Create Account
        </h1>
        <p className="text-center text-xs sm:text-sm text-gray-500 max-w-xs mb-6 leading-relaxed">
          Join Homely Foods for authentic, pure-vegetarian meals delivered to your door.
        </p>

        {errorMsg && (
          <div className="w-full bg-red-50 text-red-600 text-xs font-semibold p-3 rounded-xl border border-red-200 mb-4 text-center">
            {errorMsg}
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          <Input
            label="Full Name"
            icon={User}
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <Input
            label="Mobile Number"
            icon={Smartphone}
            type="tel"
            placeholder="Enter 10-digit number"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            required
          />

          <Input
            label="Password"
            icon={Lock}
            isPassword
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* Terms Checkbox */}
          <div className="flex items-start gap-3 mt-1">
            <input
              type="checkbox"
              id="terms"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4.5 h-4.5 rounded border-gray-300 text-[#0B392B] focus:ring-[#0B392B] cursor-pointer"
            />
            <label htmlFor="terms" className="text-xs text-gray-600 leading-normal cursor-pointer">
              I agree to the{" "}
              <span className="font-bold text-[#0B251C]">Terms & Conditions</span>{" "}
              and{" "}
              <span className="font-bold text-[#0B251C]">Privacy Policy</span>.
            </label>
          </div>

          {/* Submit Button */}
          <div className="mt-3">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Creating Account..." : "Sign Up"}
            </Button>
          </div>
        </form>

        {/* Footer Link */}
        <p className="text-xs sm:text-sm text-gray-600 mt-8 text-center">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-[#0B392B] hover:underline">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}

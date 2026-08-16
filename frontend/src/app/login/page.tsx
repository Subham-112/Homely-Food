"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Utensils, Phone, Lock } from "lucide-react";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { Post } from "@/utils/api";

interface LoginApiResponse {
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

export default function LoginPage() {
  const { login } = useAuth();
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      // Call backend API /api/user/login
      const res = await Post<LoginApiResponse>(
        "/api/user/login",
        {
          phone: mobileNumber,
          password: password,
        }
      );

      const token = res?.data?.accessToken;
      if (token) {
        login(token);
      } else {
        setErrorMsg(res.message || "Invalid login response.");
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setErrorMsg(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#FAF6ED] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 w-full">
      <div className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 flex flex-col md:flex-row my-auto">
        {/* Left Side Banner Image (Desktop Only Split View) */}
        <div className="hidden md:flex relative w-full md:w-1/2 bg-gray-200 overflow-hidden shrink-0">
          <img
            src="https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80"
            alt="Homely Food Banner"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-6 text-white">
            <h2 className="text-xl md:text-2xl font-bold font-poppins drop-shadow-md">
              Fresh & Pure Veg Meals
            </h2>
            <p className="text-xs md:text-sm text-gray-200 mt-1 drop-shadow-sm">
              Delivered straight to your doorstep with homestyle love.
            </p>
          </div>
        </div>

        {/* Right Side Login Form Card */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-10 flex flex-col justify-between items-center">
          <div className="w-full flex flex-col items-center">
            {/* Circle Logo Badge */}
            <div className="w-14 h-14 rounded-2xl bg-[#0B392B] flex items-center justify-center shadow-md mb-4 shrink-0">
              <Utensils className="w-7 h-7 text-white" />
            </div>

            {/* Brand Titles */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B251C] text-center font-poppins tracking-tight">
              Homely Foods
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 text-center mt-1 mb-6">
              Welcome back to wholesome goodness.
            </p>

            {errorMsg && (
              <div className="w-full bg-red-50 text-red-600 text-xs font-semibold p-3 rounded-xl border border-red-200 mb-4 text-center">
                {errorMsg}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
              <Input
                label="Mobile Number"
                icon={Phone}
                type="tel"
                placeholder="Enter your 10-digit number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                required
              />

              <div>
                <Input
                  label="Password"
                  icon={Lock}
                  isPassword
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="flex justify-end mt-2">
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-[#0B392B] hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <div className="mt-2">
                <Button type="submit" variant="maroon" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </div>
            </form>

            {/* Divider */}
            <div className="w-full flex items-center gap-3 my-5">
              <div className="flex-1 h-[1px] bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">or</span>
              <div className="flex-1 h-[1px] bg-gray-200" />
            </div>

            {/* Create Account Link */}
            <p className="text-xs sm:text-sm text-gray-600 text-center">
              New to Homely Foods?{" "}
              <Link href="/signup" className="font-bold text-[#0B392B] hover:underline">
                Create an Account
              </Link>
            </p>
          </div>

          {/* Discreet Admin Access Link */}
          <div className="pt-4 border-t border-gray-100 w-full flex justify-center mt-6">
            <Link
              href="/admin/login"
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-[#0B392B] transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Access</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

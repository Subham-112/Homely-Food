"use client";

import React, { useState } from "react";
import { Utensils, Mail, Lock, ArrowRight } from "lucide-react";
import Input from "@/components/Input";
import { useAuth } from "@/context/AuthContext";
import { Post } from "@/utils/api";
import Button from "@/components/Button";

export default function AdminLoginPage() {
  const { adminLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      // Call backend API /api/admin/login with payload { email, password }
      const res = await Post<any>("/api/admin/login", {
        email: email,
        password: password,
      });

      const token =
        res?.token ||
        res?.access_token ||
        res?.data?.accessToken ||
        res?.data?.token;

      if (token) {
        adminLogin(token);
      } else {
        setErrorMsg(res?.message || "Invalid response from server.");
      }
    } catch (err: any) {
      console.error("Admin login failed:", err);
      setErrorMsg(
        err?.message ||
        err?.data?.message ||
        "Invalid admin credentials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-[#F4F8FA] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 h-screen">
      <div className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-xl border border-[#E8F0F2] flex flex-col md:flex-row">
        {/* Left Banner Section (Desktop Only) */}
        <div className="hidden md:flex relative w-full md:w-1/2 bg-[#0B392B] p-8 flex-col justify-between text-white shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
            <Utensils className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl lg:text-3xl font-extrabold font-poppins leading-tight">
              Homely Foods
            </h2>
            <p className="text-xs lg:text-sm text-emerald-200 mt-2 leading-relaxed">
              Kitchen & Store Operations Management System. Secure portal for authorized personnel.
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-10 flex flex-col justify-between items-center bg-white">
          <div className="w-full flex flex-col items-center">
            {/* Circle Logo Badge */}
            <div className="w-14 h-14 rounded-2xl bg-[#0B392B] flex items-center justify-center shadow-md mb-4 shrink-0">
              <Utensils className="w-7 h-7 text-white" />
            </div>

            {/* Brand Header */}
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B251C] text-center font-poppins tracking-tight">
              Admin Portal Sign In
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 text-center mt-1 mb-6">
              Enter your credentials to manage orders & menu.
            </p>

            {errorMsg && (
              <div className="w-full bg-red-50 text-red-600 text-xs font-semibold p-3 rounded-xl border border-red-200 mb-4 text-center">
                {errorMsg}
              </div>
            )}

            {/* Admin Login Form */}
            <form onSubmit={handleAdminLogin} className="w-full flex flex-col gap-4">
              <Input
                label="Email Address"
                icon={Mail}
                type="email"
                placeholder="admin@homelyfoods.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#0B251C]">
                    Password
                  </label>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="text-xs font-semibold text-[#0B392B] hover:underline"
                  >
                    Forgot Password?
                  </a>
                </div>
                <Input
                  label=""
                  icon={Lock}
                  isPassword
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="mt-2">
                <Button
                  type="submit"
                  variant="primary"
                  icon={ArrowRight}
                  iconPosition="right"
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              </div>
            </form>
          </div>

          {/* Footer Note */}
          <p className="text-[11px] text-gray-400 text-center mt-6 leading-relaxed max-w-xs">
            Protected system. Authorized access only.
          </p>
        </div>
      </div>
    </div>
  );
}

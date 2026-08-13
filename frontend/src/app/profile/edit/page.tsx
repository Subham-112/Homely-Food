"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { Put } from "@/utils/api";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg("Name cannot be empty.");
      return;
    }

    setSubmitting(true);
    try {
      await Put("/api/user/profile", {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });

      setSuccessMsg("Profile updated successfully!");
      await refreshProfile();
      setTimeout(() => {
        router.push("/profile");
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to update profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#FAF6ED] relative">
      {/* Fixed Top Header */}
      <Header />

      {/* Middle Scrollable Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 sm:p-5 max-w-xl w-full mx-auto flex flex-col gap-4 pb-24">
        {/* Top Title & Back Button */}
        <div className="flex items-center gap-3 px-0.5">
          <button
            onClick={() => router.back()}
            className="p-2 bg-white rounded-2xl border border-[#E8E1D3] text-[#0B251C] hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B251C] font-poppins">
            Edit Profile
          </h1>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E1D3] shadow-xs">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-2xl font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-2xl font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <Input
              label="Full Name *"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Mobile Number *"
              type="tel"
              placeholder="+91 Mobile Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email address (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={submitting}
                icon={submitting ? Loader2 : Save}
              >
                {submitting ? "Saving Changes..." : "Save Profile Changes"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

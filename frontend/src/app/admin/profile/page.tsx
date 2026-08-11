"use client";

import React, { useState } from "react";
import { Save } from "lucide-react";
import Header from "@/components/Header";
import AdminBottomNav from "@/components/AdminBottomNav";
import Input from "@/components/Input";
import Button from "@/components/Button";

export default function AdminProfilePage() {
  const [storeName, setStoreName] = useState("Homely Foods Downtown");
  const [contactEmail, setContactEmail] = useState("hello@homelyfoods.com");
  const [storeAddress, setStoreAddress] = useState(
    "123 Spice Lane, Flavor District, Foodville, FV 12345"
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#FAF6ED] relative">
      {/* Header */}
      <Header />

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-5 max-w-4xl w-full mx-auto flex flex-col gap-4 pb-20">
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B251C] font-poppins">
          Store Settings
        </h1>

        {/* Store Information Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-2xs flex flex-col gap-4">
          <h2 className="text-base sm:text-lg font-extrabold text-[#0B251C] border-b border-gray-100 pb-3">
            Store Information
          </h2>

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <Input
              label="Store Name"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
            />

            <Input
              label="Contact Email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
            />

            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-semibold text-[#0B251C]">
                Store Address
              </label>
              <textarea
                rows={3}
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#0F261C] focus:outline-none focus:border-[#0B392B]"
                required
              />
            </div>

            {savedSuccess && (
              <div className="bg-[#EAF5EE] text-[#00875A] text-xs font-bold p-3 rounded-xl border border-[#D5EBDC] text-center">
                ✓ Store settings saved successfully!
              </div>
            )}

            <div className="mt-2">
              <Button type="submit" variant="primary" icon={Save} iconPosition="left">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Pinned Bottom Navigation with Profile Tab Active */}
      <AdminBottomNav />
    </div>
  );
}

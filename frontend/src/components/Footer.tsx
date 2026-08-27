"use client";

import React, { useEffect, useState } from "react";
import { Phone, Mail, MapPin, ShieldCheck, FileCheck, Clock, Store } from "lucide-react";
import { getShopDetails, ShopDetails } from "@/services/shopDetailsService";

export default function Footer() {
  const [shop, setShop] = useState<ShopDetails | null>(null);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const details = await getShopDetails();
        setShop(details);
      } catch (err) {
        console.error("Failed to load shop details for footer:", err);
      }
    };
    fetchShop();
  }, []);

  if (!shop) return null;

  const fullAddress = [
    shop.address?.street,
    shop.address?.area,
    shop.address?.city,
    shop.address?.state,
    shop.address?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  const primaryPhone = shop.phones && shop.phones.length > 0 ? shop.phones[0] : "";
  const primaryEmail = shop.emails && shop.emails.length > 0 ? shop.emails[0] : "";

  return (
    <footer className="w-full bg-[#0B251C] text-white pt-8 pb-24 px-4 sm:px-6 border-t border-emerald-900/40">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        {/* Top Branding Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-900/50 pb-6">
          <div className="flex items-center gap-3">
            {shop.logo ? (
              <img
                src={shop.logo}
                alt={shop.shopName}
                className="w-12 h-12 rounded-2xl object-cover border border-emerald-700/50 shadow-md"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-emerald-700/30 text-emerald-400 flex items-center justify-center border border-emerald-600/40 font-extrabold text-xl shadow-md">
                <Store className="w-6 h-6" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-extrabold text-white font-poppins">
                {shop.shopName || "Homely Food"}
              </h3>
              <p className="text-xs text-emerald-200/80 font-medium">
                Fresh & Authentic Home Cooked Meals
              </p>
            </div>
          </div>

          {/* Store Open/Closed Status Badge */}
          <div className="flex items-center gap-2 bg-emerald-900/40 px-3.5 py-2 rounded-2xl border border-emerald-700/40 shrink-0">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                shop.isStoreOpen ? "bg-emerald-400 animate-pulse" : "bg-red-400"
              }`}
            />
            <span
              className={`text-xs font-extrabold ${
                shop.isStoreOpen ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {shop.isStoreOpen ? "Currently Open" : "Currently Closed"}
            </span>
          </div>
        </div>

        {/* Middle Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-emerald-100/90">
          {/* Address Section */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400" /> Address
            </span>
            <p className="leading-relaxed text-gray-200">
              {fullAddress || "Surat, Gujarat"}
              {shop.address?.landmark && (
                <span className="block text-emerald-300/80 font-medium mt-0.5">
                  Landmark: {shop.address.landmark}
                </span>
              )}
            </p>
          </div>

          {/* Contact Details Section */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-400" /> Contact Support
            </span>

            {/* Phones */}
            <div className="flex flex-col gap-1.5">
              {shop.phones?.map((phone, i) => (
                <a
                  key={i}
                  href={`tel:${phone}`}
                  className="flex items-center gap-2 text-white hover:text-emerald-300 transition-colors font-bold text-xs group"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>{phone}</span>
                </a>
              ))}
            </div>

            {/* Emails */}
            <div className="flex flex-col gap-1.5 pt-1">
              {shop.emails?.map((email, i) => (
                <a
                  key={i}
                  href={`mailto:${email}`}
                  className="flex items-center gap-2 text-white hover:text-emerald-300 transition-colors font-semibold text-xs group"
                >
                  <Mail className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>{email}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Licenses & Compliance Section */}
          {(shop.fssaiLicenseNumber || shop.gstNumber || shop.ownerName) && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Licenses & Info
              </span>
              <div className="flex flex-col gap-1.5 bg-emerald-950/60 p-3 rounded-2xl border border-emerald-800/40">
                {shop.fssaiLicenseNumber && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-emerald-300/80 font-medium">FSSAI Lic. No:</span>
                    <span className="font-mono font-bold text-white">{shop.fssaiLicenseNumber}</span>
                  </div>
                )}
                {shop.gstNumber && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-emerald-300/80 font-medium">GSTIN:</span>
                    <span className="font-mono font-bold text-white">{shop.gstNumber}</span>
                  </div>
                )}
                {shop.ownerName && (
                  <div
                    className={`flex items-center justify-between text-[11px] ${
                      shop.fssaiLicenseNumber || shop.gstNumber
                        ? "pt-1 border-t border-emerald-800/50"
                        : ""
                    }`}
                  >
                    <span className="text-emerald-300/80 font-medium">Owner:</span>
                    <span className="font-bold text-white">{shop.ownerName}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Copyright */}
        <div className="pt-4 border-t border-emerald-900/50 text-center text-[11px] text-emerald-400/70 font-medium">
          © {new Date().getFullYear()} {shop.shopName || "Homely Food"}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

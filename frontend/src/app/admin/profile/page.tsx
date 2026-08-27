"use client";

import React, { useState, useEffect } from "react";
import { Save, Loader2, Store, MapPin, Phone, Mail, Clock, ShieldCheck, Plus, X, Truck } from "lucide-react";
import Header from "@/components/Header";
import AdminBottomNav from "@/components/AdminBottomNav";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { getShopDetails, updateShopDetails, toggleStoreStatus, ShopDetails } from "@/services/shopDetailsService";

export default function AdminProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [phones, setPhones] = useState<string[]>([]);
  const [street, setStreet] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [landmark, setLandmark] = useState("");
  const [serviceablePincodes, setServiceablePincodes] = useState<string[]>([]);
  const [newPincodeInput, setNewPincodeInput] = useState("");
  const [openingTime, setOpeningTime] = useState("");
  const [closingTime, setClosingTime] = useState("");
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [minimumOrderAmount, setMinimumOrderAmount] = useState<number>(0);
  const [deliveryCharge, setDeliveryCharge] = useState<number>(0);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number>(0);
  const [fssaiLicenseNumber, setFssaiLicenseNumber] = useState("");
  const [gstNumber, setGstNumber] = useState("");

  // Dynamic Array Handlers (Emails, Phones, Pincodes)
  const [newEmailInput, setNewEmailInput] = useState("");
  const [newPhoneInput, setNewPhoneInput] = useState("");

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const details = await getShopDetails();
        setShopName(details.shopName || "");
        setOwnerName(details.ownerName || "");
        setEmails(details.emails || []);
        setPhones(details.phones || []);
        setStreet(details.address?.street || "");
        setArea(details.address?.area || "");
        setCity(details.address?.city || "");
        setState(details.address?.state || "");
        setPincode(details.address?.pincode || "");
        setLandmark(details.address?.landmark || "");
        setServiceablePincodes(details.serviceablePincodes || []);
        setOpeningTime(details.openingTime || "08:00 AM");
        setClosingTime(details.closingTime || "10:00 PM");
        setIsStoreOpen(details.isStoreOpen ?? true);
        setMinimumOrderAmount(details.minimumOrderAmount || 0);
        setDeliveryCharge(details.deliveryCharge || 0);
        setFreeDeliveryThreshold(details.freeDeliveryThreshold || 0);
        setFssaiLicenseNumber(details.fssaiLicenseNumber || "");
        setGstNumber(details.gstNumber || "");
      } catch (err: any) {
        setError(err?.message || "Failed to load store settings.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, []);

  // Add/Remove Email
  const handleAddEmail = () => {
    if (!newEmailInput.trim()) return;
    if (!emails.includes(newEmailInput.trim())) {
      setEmails((prev) => [...prev, newEmailInput.trim()]);
    }
    setNewEmailInput("");
  };

  const handleRemoveEmail = (index: number) => {
    setEmails((prev) => prev.filter((_, i) => i !== index));
  };

  // Add/Remove Phone
  const handleAddPhone = () => {
    if (!newPhoneInput.trim()) return;
    if (!phones.includes(newPhoneInput.trim())) {
      setPhones((prev) => [...prev, newPhoneInput.trim()]);
    }
    setNewPhoneInput("");
  };

  const handleRemovePhone = (index: number) => {
    setPhones((prev) => prev.filter((_, i) => i !== index));
  };

  // Add/Remove Pincode
  const handleAddPincode = () => {
    if (!newPincodeInput.trim()) return;
    const code = newPincodeInput.trim();
    if (!serviceablePincodes.includes(code)) {
      setServiceablePincodes((prev) => [...prev, code]);
    }
    setNewPincodeInput("");
  };

  const handleRemovePincode = (codeToRemove: string) => {
    setServiceablePincodes((prev) => prev.filter((c) => c !== codeToRemove));
  };

  const handleToggleStoreStatus = async () => {
    setTogglingStatus(true);
    setError(null);
    try {
      const updated = await toggleStoreStatus();
      setIsStoreOpen(updated.isStoreOpen);
    } catch (err: any) {
      setError(err?.message || "Failed to toggle store status.");
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    setError(null);

    const payload: Partial<ShopDetails> = {
      shopName,
      ownerName,
      emails,
      phones,
      address: {
        street,
        area,
        city,
        state,
        pincode,
        landmark,
      },
      serviceablePincodes,
      openingTime,
      closingTime,
      isStoreOpen,
      minimumOrderAmount: Number(minimumOrderAmount),
      deliveryCharge: Number(deliveryCharge),
      freeDeliveryThreshold: Number(freeDeliveryThreshold),
      fssaiLicenseNumber,
      gstNumber,
    };

    try {
      await updateShopDetails(payload);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to update store settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#FAF6ED] relative">
      {/* Header */}
      <Header />

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 sm:p-5 max-w-4xl w-full mx-auto flex flex-col gap-5 pb-28">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B251C] font-poppins">
              Store Settings
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Manage shop profile, contact info, address & serviceable pincodes
            </p>
          </div>

          {/* Master Store Toggle Switch */}
          <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-[#E8E1D3] shadow-2xs shrink-0">
            <div className="flex flex-col">
              <span className="text-xs font-extrabold text-[#0B251C] leading-tight">
                Store Status
              </span>
              <span className={`text-[10px] font-bold ${isStoreOpen ? "text-emerald-600" : "text-red-500"}`}>
                {isStoreOpen ? "Open for Orders" : "Store Closed"}
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isStoreOpen}
              disabled={togglingStatus}
              onClick={handleToggleStoreStatus}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                isStoreOpen ? "bg-emerald-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                  isStoreOpen ? "translate-x-5" : "translate-x-0"
                }`}
              >
                {togglingStatus && <Loader2 className="w-3 h-3 animate-spin text-[#0B392B]" />}
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-2xl font-semibold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-gray-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#0B392B]" />
            <span className="text-xs font-semibold">Loading store settings...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-5">
            {/* 1. Basic Shop Information */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E1D3] shadow-2xs flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Store className="w-5 h-5 text-[#0B392B]" />
                <h2 className="text-base sm:text-lg font-extrabold text-[#0B251C]">
                  Basic Information
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Shop Name *"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  required
                />
                <Input
                  label="Owner Name *"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 2. Contact Numbers & Emails */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E1D3] shadow-2xs flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Phone className="w-5 h-5 text-[#0B392B]" />
                <h2 className="text-base sm:text-lg font-extrabold text-[#0B251C]">
                  Contact Information (Multiple)
                </h2>
              </div>

              {/* Phone Numbers */}
              <div>
                <label className="block text-xs font-extrabold text-gray-700 mb-1">
                  Contact Phone Numbers *
                </label>
                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    value={newPhoneInput}
                    onChange={(e) => setNewPhoneInput(e.target.value)}
                    className="w-full sm:flex-1 px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B392B]"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhone}
                    className="w-full sm:w-auto bg-[#0B392B] hover:bg-[#07281E] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Add Phone
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {phones.map((phone, idx) => (
                    <span
                      key={idx}
                      className="bg-emerald-50 text-[#0B392B] border border-emerald-200 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-2"
                    >
                      {phone}
                      <button
                        type="button"
                        onClick={() => handleRemovePhone(idx)}
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Emails */}
              <div>
                <label className="block text-xs font-extrabold text-gray-700 mb-1">
                  Contact Email Addresses *
                </label>
                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    className="w-full sm:flex-1 px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B392B]"
                  />
                  <button
                    type="button"
                    onClick={handleAddEmail}
                    className="w-full sm:w-auto bg-[#0B392B] hover:bg-[#07281E] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Add Email
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {emails.map((email, idx) => (
                    <span
                      key={idx}
                      className="bg-emerald-50 text-[#0B392B] border border-emerald-200 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-2"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(idx)}
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Shop Address */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E1D3] shadow-2xs flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <MapPin className="w-5 h-5 text-[#0B392B]" />
                <h2 className="text-base sm:text-lg font-extrabold text-[#0B251C]">
                  Shop Address Details
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Street / Building"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
                <Input
                  label="Area / Suburb"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                />
                <Input
                  label="City *"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
                <Input
                  label="State *"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                />
                <Input
                  label="Shop Pincode *"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  required
                />
                <Input
                  label="Landmark"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                />
              </div>
            </div>

            {/* 4. Serviceable Delivery Pincodes */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E1D3] shadow-2xs flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <MapPin className="w-5 h-5 text-[#0B392B]" />
                <h2 className="text-base sm:text-lg font-extrabold text-[#0B251C]">
                  Serviceable Delivery Pincodes
                </h2>
              </div>

              <p className="text-xs text-gray-500">
                Only orders with delivery pincodes matching these numbers will be accepted.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter 6-digit Pincode (e.g. 395007)"
                  value={newPincodeInput}
                  onChange={(e) => setNewPincodeInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B392B] font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={handleAddPincode}
                  className="bg-[#0B392B] hover:bg-[#07281E] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add Pincode
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {serviceablePincodes.map((code) => (
                  <span
                    key={code}
                    className="bg-[#0B392B] text-white font-mono text-xs font-extrabold px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-2xs"
                  >
                    {code}
                    <button
                      type="button"
                      onClick={() => handleRemovePincode(code)}
                      className="text-emerald-300 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 5. Store Timings & Delivery Configuration */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E1D3] shadow-2xs flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Clock className="w-5 h-5 text-[#0B392B]" />
                <h2 className="text-base sm:text-lg font-extrabold text-[#0B251C]">
                  Store Timings & Delivery Settings
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Opening Time"
                  placeholder="e.g. 08:00 AM"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  icon={Clock}
                />
                <Input
                  label="Closing Time"
                  placeholder="e.g. 10:00 PM"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  icon={Clock}
                />
                <Input
                  label="Standard Delivery Charge (₹)"
                  type="number"
                  min="0"
                  placeholder="30"
                  value={deliveryCharge === 0 ? "0" : deliveryCharge || ""}
                  onChange={(e) => setDeliveryCharge(Number(e.target.value) || 0)}
                  icon={Truck}
                />
                <Input
                  label="Free Delivery Threshold (₹)"
                  type="number"
                  min="0"
                  placeholder="500"
                  value={freeDeliveryThreshold === 0 ? "0" : freeDeliveryThreshold || ""}
                  onChange={(e) => setFreeDeliveryThreshold(Number(e.target.value) || 0)}
                  icon={Truck}
                />
              </div>
              <p className="text-[11px] text-gray-500 font-medium -mt-1">
                * Orders with a subtotal equal to or exceeding the Free Delivery Threshold will receive free delivery (₹0 delivery charge).
              </p>
            </div>

            {/* 6. Regulatory & Licenses */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E1D3] shadow-2xs flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <ShieldCheck className="w-5 h-5 text-[#0B392B]" />
                <h2 className="text-base sm:text-lg font-extrabold text-[#0B251C]">
                  Legal & FSSAI Details
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="FSSAI License Number"
                  value={fssaiLicenseNumber}
                  onChange={(e) => setFssaiLicenseNumber(e.target.value)}
                />
                <Input
                  label="GST Number"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                />
              </div>
            </div>

            {savedSuccess && (
              <div className="bg-[#EAF5EE] text-[#00875A] text-xs font-bold p-3.5 rounded-2xl border border-[#D5EBDC] text-center">
                ✓ Store settings saved successfully!
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                icon={saving ? Loader2 : Save}
                iconPosition="left"
                disabled={saving}
              >
                {saving ? "Saving Store Settings..." : "Save Store Settings"}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Bottom Navigation */}
      <AdminBottomNav />
    </div>
  );
}

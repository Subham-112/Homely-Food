"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Globe, CheckCircle2, AlertTriangle, Scale } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getShopDetails, ShopDetails } from "@/services/shopDetailsService";

export default function TermsAndConditionsPage() {
  const [shop, setShop] = useState<ShopDetails | null>(null);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const details = await getShopDetails();
        setShop(details);
      } catch (err) {
        console.error("Failed to load shop details:", err);
      }
    };
    fetchShop();
  }, []);

  const primaryPhone = shop?.phones && shop.phones.length > 0 ? shop.phones[0] : "+91 98765 43210";
  const primaryEmail = shop?.emails && shop.emails.length > 0 ? shop.emails[0] : "support@homelyfoods.shop";
  const fullAddress = [
    shop?.address?.street,
    shop?.address?.area,
    shop?.address?.city,
    shop?.address?.state,
    shop?.address?.pincode,
  ]
    .filter(Boolean)
    .join(", ") || "Surat, Gujarat, India";

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF6ED] text-[#0B251C] selection:bg-[#0B392B] selection:text-white">
      {/* Header with Back Button (No Hamburger Menu) */}
      <Header showMenu={false} showBack={true} />

      {/* Hero Banner */}
      <div className="bg-gradient-to-b from-[#0B392B] to-[#07251C] text-white pt-8 pb-12 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="max-w-4xl mx-auto flex items-center gap-3.5 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-300 shrink-0 shadow-lg">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-poppins tracking-tight text-white">
              Terms & Conditions
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 font-medium mt-0.5">
              Effective Date: 1 September 2026
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 -mt-6 pb-20 z-20">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8E1D3] shadow-lg flex flex-col gap-8 text-sm sm:text-base leading-relaxed text-gray-700">
          
          {/* Introduction Card */}
          <div className="bg-[#FAF6ED] rounded-2xl p-5 border border-[#E8E1D3] text-gray-800 flex flex-col gap-3">
            <p className="font-medium">
              Welcome to <strong className="text-[#0B251C]">{shop?.shopName || "Homely Foods"}</strong> and <strong className="text-[#0B251C]">HomelyFoods.shop</strong> (&quot;Website&quot;, &quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              These Terms & Conditions govern your access to and use of HomelyFoods.shop, including account registration, browsing the menu, placing food orders, making payments, receiving deliveries, and using applicable offers, rewards, referrals or Homely Coins.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              By creating an account or using HomelyFoods.shop, you agree to these Terms & Conditions and our{" "}
              <Link href="/privacy-policy" className="text-[#0B392B] font-bold underline">
                Privacy Policy
              </Link>.
            </p>
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-xs font-medium">
              If you do not agree with these terms, please do not use the Website or place an order through it.
            </div>
          </div>

          {/* Section 1: About HomelyFoods.shop */}
          <section className="flex flex-col gap-3 border-b border-gray-100 pb-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">1</span>
              About HomelyFoods.shop
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              HomelyFoods.shop is an online platform operated by Homely Foods for displaying and ordering food and related products/services offered by Homely Foods.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              We may update, add, remove or modify products, prices, menus, offers, availability and Website features from time to time.
            </p>
          </section>

          {/* Section 2: Account Registration */}
          <section className="flex flex-col gap-3 border-b border-gray-100 pb-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">2</span>
              Account Registration
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              To use certain features of the Website, you may be required to create an account. You agree to:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm pt-1">
              {[
                "Provide accurate and complete information",
                "Keep your account information updated",
                "Keep your login credentials and OTPs confidential",
                "Not use another person's account without authorization",
                "Immediately inform us if you suspect unauthorized access to your account",
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-2 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-gray-700 font-medium">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500 font-medium mt-1">
              You are responsible for activities carried out through your account unless caused by circumstances beyond your reasonable control.
            </p>
          </section>

          {/* Section 3: Food Orders */}
          <section className="flex flex-col gap-3 border-b border-gray-100 pb-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">3</span>
              Food Orders
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              When placing an order, you must provide accurate delivery and contact information.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              An order is considered successfully placed only after the Website or Homely Foods provides appropriate confirmation.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              Order acceptance may depend on product availability, operating hours, delivery availability, payment status and other operational circumstances.
            </p>
            <p className="text-xs sm:text-sm text-gray-600 font-semibold text-gray-800">
              We reserve the right to decline, cancel or modify an order where reasonably necessary, including where:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-gray-600 pl-2">
              <li>A requested item is unavailable</li>
              <li>The delivery location is outside our service area</li>
              <li>There is an incorrect price or product information</li>
              <li>There is a suspected fraudulent or unauthorized transaction</li>
              <li>There is a technical or system error</li>
              <li>Circumstances beyond our reasonable control affect fulfilment</li>
            </ul>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Where payment has already been received for an order that we cancel, the applicable amount will be refunded according to the relevant payment/refund process.
            </p>
          </section>

          {/* Section 4: Product Availability and Information */}
          <section className="flex flex-col gap-3 border-b border-gray-100 pb-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">4</span>
              Product Availability and Information
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              We make reasonable efforts to keep menu information, prices, photographs and descriptions accurate.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              Food photographs are for representation purposes and actual presentation may vary.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              Availability of food items may change based on stock, ingredients, preparation capacity and operating conditions.
            </p>
          </section>

          {/* Section 5: Prices and Charges */}
          <section className="flex flex-col gap-3 border-b border-gray-100 pb-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">5</span>
              Prices and Charges
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Prices displayed on HomelyFoods.shop are the applicable prices shown at the time of ordering unless there is an obvious technical or pricing error.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              Applicable taxes, delivery charges, packaging charges or other applicable charges, if any, will be displayed or communicated as applicable before order completion.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              We may change prices or charges from time to time without affecting orders that have already been accepted, except where correction is necessary due to an obvious error or applicable law.
            </p>
          </section>

          {/* Section 6: Payments */}
          <section className="flex flex-col gap-3 border-b border-gray-100 pb-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">6</span>
              Payments
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              We may provide one or more payment methods, including online payment and other payment options made available on the Website.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              You agree to provide valid payment information and authorize the applicable payment transaction for your order.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              If a payment is unsuccessful, the order may not be processed until successful payment or another accepted payment method is confirmed.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              Refunds, where applicable, will be processed through the appropriate payment method or as otherwise reasonably determined by Homely Foods.
            </p>
          </section>

          {/* Section 7: Cancellation, Refunds and Order Issues */}
          <section className="flex flex-col gap-3 border-b border-gray-100 pb-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">7</span>
              Cancellation, Refunds and Order Issues
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Cancellation and refund eligibility may depend on the stage of order preparation, delivery status, reason for cancellation and applicable law.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              If an order has already been prepared or dispatched, cancellation may not always be possible.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              If you receive an incorrect, incomplete or materially damaged order, please contact Homely Foods promptly with the order details so that we can investigate and provide an appropriate resolution.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              Any refund or replacement will be subject to verification and the applicable Homely Foods policy.
            </p>
            <p className="text-xs sm:text-sm text-gray-600 italic">
              Nothing in these Terms is intended to limit any consumer rights that cannot lawfully be excluded.
            </p>
          </section>

          {/* Section 8: Delivery */}
          <section className="flex flex-col gap-3 border-b border-gray-100 pb-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">8</span>
              Delivery
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              We make reasonable efforts to deliver orders within the estimated delivery time communicated to you.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              Delivery times are estimates and may be affected by traffic, weather, high order volumes, staffing, technical problems, location accessibility or other circumstances beyond our reasonable control.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              You should provide a correct and accessible delivery address and remain reasonably available to receive the order.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              If an order cannot be delivered because the customer provided incorrect information, is unavailable, refuses delivery or the location is inaccessible, Homely Foods may take an appropriate action based on the circumstances.
            </p>
          </section>

          {/* Section 9: Offers, Rewards, Referrals and Homely Coins */}
          <section className="flex flex-col gap-3 border-b border-gray-100 pb-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">9</span>
              Offers, Rewards, Referrals and Homely Coins
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Homely Foods may provide promotional offers, referral benefits, rewards or Homely Coins from time to time. Unless specifically stated otherwise:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-gray-600 pl-2">
              <li>Offers are subject to their individual conditions.</li>
              <li>Offers may have validity periods, eligibility requirements or usage limits.</li>
              <li>Homely Coins or similar promotional credits may not be treated as cash.</li>
              <li>Homely Coins may be valid only for the period specified by Homely Foods.</li>
              <li>Promotional benefits may not be transferable or redeemable for cash unless expressly stated.</li>
              <li>Homely Foods may cancel or reverse rewards or promotional credits obtained through fraud, misuse, duplicate accounts, manipulation or violation of applicable conditions.</li>
            </ul>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Specific offer terms displayed with an offer will take precedence over general promotional terms where applicable.
            </p>
          </section>

          {/* Section 10: Prohibited Use */}
          <section className="flex flex-col gap-3 border-b border-gray-100 pb-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">10</span>
              Prohibited Use
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">You agree not to:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm pt-1">
              {[
                "Use the Website for unlawful purposes",
                "Create false or fraudulent accounts",
                "Provide misleading information",
                "Attempt to gain unauthorized access to accounts or systems",
                "Interfere with Website security or functionality",
                "Exploit technical errors, pricing errors or promotions",
                "Use bots, scripts or automated systems to abuse the site",
                "Engage in fraudulent payment or refund activity",
                "Misuse offers, referrals, rewards or Homely Coins",
                "Copy, reproduce or commercially exploit Website content",
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-2 bg-red-50/50 p-2.5 rounded-xl border border-red-100/60">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="text-gray-700 font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 11: User Reviews and Content */}
          <section className="flex flex-col gap-3 border-b border-gray-100 pb-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">11</span>
              User Reviews and Content
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              If the Website allows customers to submit reviews, feedback, photographs or other content, you agree that the information you submit should be truthful, lawful and not harmful, abusive, defamatory or misleading.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              You should not submit another person&apos;s personal information without appropriate authorization.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              Homely Foods may remove content that violates these Terms or applicable law.
            </p>
          </section>

          {/* Section 12: Intellectual Property */}
          <section className="flex flex-col gap-3 border-b border-gray-100 pb-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">12</span>
              Intellectual Property
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              The Homely Foods name, logo, branding, Website design, text, photographs, graphics, menus and other content provided by Homely Foods are protected by applicable intellectual property laws.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              You may use the Website for personal and legitimate purchasing purposes only.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              You may not reproduce, modify, distribute, sell or commercially exploit Homely Foods content without prior written permission.
            </p>
          </section>

          {/* Section 13: Website Availability */}
          <section className="flex flex-col gap-3 border-b border-gray-100 pb-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">13</span>
              Website Availability
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              We aim to keep HomelyFoods.shop available and functional, but we do not guarantee uninterrupted or error-free access at all times.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              The Website may occasionally be unavailable due to maintenance, updates, technical problems, network failures or circumstances beyond our reasonable control.
            </p>
          </section>

          {/* Section 14: Limitation of Liability */}
          <section className="flex flex-col gap-3 border-b border-gray-100 pb-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">14</span>
              Limitation of Liability
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Homely Foods will take reasonable care in providing its services.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              To the extent permitted by applicable law, Homely Foods will not be responsible for losses caused solely by circumstances outside its reasonable control, including internet failures, third-party payment failures, extraordinary delivery disruptions or other force majeure events.
            </p>
            <p className="text-xs sm:text-sm text-gray-600 italic">
              Nothing in these Terms excludes or limits liability or consumer rights that cannot legally be excluded or limited.
            </p>
          </section>

          {/* Section 15: Suspension or Termination of Accounts */}
          <section className="flex flex-col gap-3 border-b border-gray-100 pb-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">15</span>
              Suspension or Termination of Accounts
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Homely Foods may suspend or terminate an account where there is reasonable evidence of fraud, misuse, unauthorized activity, abuse of offers/rewards, violation of these Terms, or other unlawful or harmful activity.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              Where appropriate, customers may contact Homely Foods to request clarification or resolution.
            </p>
          </section>

          {/* Section 16: Privacy */}
          <section className="flex flex-col gap-3 border-b border-gray-100 pb-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">16</span>
              Privacy
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Your use of HomelyFoods.shop is also governed by our{" "}
              <Link href="/privacy-policy" className="text-[#0B392B] font-bold underline">
                Privacy Policy
              </Link>, which explains how we collect, use and protect personal information.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              By using the Website, you acknowledge that you have read and understood the Privacy Policy.
            </p>
          </section>

          {/* Section 17: Changes to These Terms */}
          <section className="flex flex-col gap-3 border-b border-gray-100 pb-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">17</span>
              Changes to These Terms
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Homely Foods may update these Terms & Conditions from time to time.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              The updated Terms will be published on HomelyFoods.shop with the revised effective date.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              Your continued use of the Website after an update may constitute acceptance of the revised Terms, subject to applicable law.
            </p>
          </section>

          {/* Section 18: Governing Law and Disputes */}
          <section className="flex flex-col gap-3 border-b border-gray-100 pb-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">18</span>
              Governing Law and Disputes
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              These Terms are governed by the laws applicable in India.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              Any dispute will be subject to the jurisdiction of the courts and competent authorities having jurisdiction over the relevant Homely Foods business location, subject to applicable consumer-protection laws and the jurisdiction available to consumers under applicable law.
            </p>
          </section>

          {/* Section 19: Customer Support and Grievances */}
          <section className="flex flex-col gap-4 bg-[#FAF6ED] p-6 rounded-2xl border border-[#E8E1D3]">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#0B392B] text-white flex items-center justify-center text-xs font-bold shrink-0">19</span>
              Customer Support and Grievances
            </h2>
            <p className="text-xs sm:text-sm text-gray-700">
              For order-related issues, complaints, refunds, account concerns or other questions, please contact:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-[#E8E1D3]">
                <Globe className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-900 block">Website</span>
                  <span className="text-gray-600 font-mono">HomelyFoods.shop</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-[#E8E1D3]">
                <Mail className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-900 block">Email</span>
                  <a href={`mailto:${primaryEmail}`} className="text-emerald-700 hover:underline font-medium">
                    {primaryEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-[#E8E1D3]">
                <Phone className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-900 block">Phone</span>
                  <a href={`tel:${primaryPhone}`} className="text-emerald-700 hover:underline font-medium">
                    {primaryPhone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-[#E8E1D3]">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-900 block">Address</span>
                  <span className="text-gray-600">{fullAddress}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-600 mt-1">
              We will make reasonable efforts to review and resolve customer complaints in accordance with applicable law and our internal procedures.
            </p>
          </section>

          {/* Section 20: Acceptance */}
          <section className="flex flex-col gap-3 bg-emerald-50/70 p-6 rounded-2xl border border-emerald-200/60">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0">20</span>
              Acceptance
            </h2>
            <p className="text-xs sm:text-sm text-gray-700 font-medium">
              By registering on HomelyFoods.shop, placing an order, or otherwise using the Website, you confirm that you have read, understood and agreed to these Terms & Conditions and the Privacy Policy.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              If you do not agree with these Terms & Conditions, please do not use HomelyFoods.shop.
            </p>
            <p className="text-xs sm:text-sm font-extrabold text-[#0B392B] mt-1">
              Thank you for choosing Homely Foods.
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Globe, CheckCircle2, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getShopDetails, ShopDetails } from "@/services/shopDetailsService";

export default function PrivacyPolicyPage() {
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
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-poppins tracking-tight text-white">
              Privacy Policy
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
              At Homely Foods, we respect your privacy and are committed to protecting the personal information you provide while using our website, creating an account, placing food orders, making payments, and using our services.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              This Privacy Policy explains what information we collect, why we collect it, how we use it, how we protect it, and the choices available to you.
            </p>
          </div>

          {/* Section 1: Information We Collect */}
          <section className="flex flex-col gap-3 ">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">1</span>
              Information We Collect
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              When you use HomelyFoods.shop, we may collect information such as:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm pt-1">
              {[
                "Name",
                "Mobile number",
                "Email address, where provided",
                "Delivery address and location details",
                "Account/login information",
                "Order history and order details",
                "Payment and transaction-related information",
                "Information provided when contacting customer support",
                "Information relating to offers, rewards, referrals or Homely Coins, where applicable",
                "Device, browser and technical information necessary for operating and securing the Website",
                "Information about how you use the Website, such as pages or features accessed",
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-2 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-gray-700 font-medium">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500 font-medium italic mt-1">
              We only seek information that is reasonably necessary for providing and improving our services.
            </p>
          </section>

          {/* Section 2: How We Use Your Information */}
          <section className="flex flex-col gap-3 ">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">2</span>
              How We Use Your Information
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">We may use your information to:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm pt-1">
              {[
                "Create and manage your Homely Foods account",
                "Process and deliver your food orders",
                "Confirm and communicate order details",
                "Process payments and refunds",
                "Provide customer support",
                "Maintain your order history",
                "Provide applicable offers, rewards, referrals or Homely Coins",
                "Contact you regarding your orders or important service-related matters",
                "Improve our food, services, Website and customer experience",
                "Detect, prevent and investigate fraud, misuse or unauthorized activity",
                "Maintain the security and functionality of the Website",
                "Comply with applicable laws and legal requirements",
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-2 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-gray-700 font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 3: Payments */}
          <section className="flex flex-col gap-3 ">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">3</span>
              Payments
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Where online payment is available, payment information may be processed through third-party payment service providers.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              Homely Foods does not intend to store your complete card, UPI, banking or other sensitive payment credentials on its own systems unless specifically required and lawfully permitted.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              Payment providers may process information according to their own privacy policies and security practices.
            </p>
          </section>

          {/* Section 4: Delivery Information */}
          <section className="flex flex-col gap-3 ">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">4</span>
              Delivery Information
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              We use the delivery information provided by you to fulfil your order.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              Your name, phone number and delivery address may be shared with relevant personnel, delivery partners or service providers only to the extent reasonably necessary to complete and support your order.
            </p>
          </section>

          {/* Section 5: Cookies and Similar Technologies */}
          <section className="flex flex-col gap-3 ">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">5</span>
              Cookies and Similar Technologies
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              HomelyFoods.shop may use cookies or similar technologies to maintain login sessions, remember preferences, improve functionality, understand Website usage and provide a better user experience.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              You may be able to control cookies through your browser or device settings. Disabling certain cookies may affect some Website functionality.
            </p>
          </section>

          {/* Section 6: Sharing of Information */}
          <section className="flex flex-col gap-3 ">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">6</span>
              Sharing of Information
            </h2>
            <p className="text-xs sm:text-sm text-gray-700 font-semibold">
              We do not sell your personal information as a business practice.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              We may share necessary information with trusted service providers or partners when required to operate our services, such as:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-gray-600 pl-2">
              <li>Payment service providers</li>
              <li>Delivery/service partners</li>
              <li>Website hosting and technology providers</li>
              <li>Customer-support providers</li>
              <li>Security and fraud-prevention providers</li>
              <li>Government authorities or law-enforcement agencies where required by applicable law</li>
            </ul>
            <p className="text-xs sm:text-sm text-gray-600">
              We expect service providers handling personal information on our behalf to maintain appropriate confidentiality and security.
            </p>
          </section>

          {/* Section 7: Data Security */}
          <section className="flex flex-col gap-3 ">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">7</span>
              Data Security
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              We take reasonable technical and organizational measures to protect personal information against unauthorized access, misuse, alteration, loss or disclosure.
            </p>
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3.5 text-xs font-medium">
              However, no internet-based service can guarantee absolute security. You should also keep your account credentials and OTPs confidential and should never share them with another person.
            </div>
          </section>

          {/* Section 8: Your Account */}
          <section className="flex flex-col gap-3 ">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">8</span>
              Your Account
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              You are responsible for maintaining the confidentiality of your account credentials and for activities carried out through your account.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              If you believe that your account has been accessed without authorization, please contact Homely Foods as soon as possible.
            </p>
          </section>

          {/* Section 9: Communications */}
          <section className="flex flex-col gap-3 ">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">9</span>
              Communications
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              We may contact you through phone, SMS, email, WhatsApp, notifications or other available communication methods for purposes such as:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-gray-600 pl-2">
              <li>Order confirmation</li>
              <li>Delivery updates</li>
              <li>Payment or refund information</li>
              <li>Account-related notifications</li>
              <li>Customer support</li>
              <li>Important changes to our services or policies</li>
            </ul>
            <p className="text-xs sm:text-sm text-gray-600">
              Promotional communications, where applicable, may be subject to your preferences and applicable law.
            </p>
          </section>

          {/* Section 10: Children's Privacy */}
          <section className="flex flex-col gap-3 ">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">10</span>
              Children&apos;s Privacy
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              HomelyFoods.shop is intended for users who are legally able to enter into transactions under applicable law.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              We do not knowingly seek to collect personal information from children in violation of applicable law. If you believe that information belonging to a child has been provided to us improperly, please contact us.
            </p>
          </section>

          {/* Section 11: Data Retention */}
          <section className="flex flex-col gap-3 ">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">11</span>
              Data Retention
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              We retain personal information only for as long as reasonably necessary for the purposes described in this Privacy Policy, including order processing, customer service, accounting, fraud prevention, dispute resolution and compliance with legal obligations.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              When information is no longer required, it may be deleted, anonymized or securely disposed of, subject to applicable legal requirements.
            </p>
          </section>

          {/* Section 12: Your Privacy Rights */}
          <section className="flex flex-col gap-3 ">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">12</span>
              Your Privacy Rights
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Subject to applicable law, you may have rights regarding your personal information, including rights to access, correction, updating, withdrawal of consent where applicable, or deletion/erasure where legally available.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              Requests may be made using the contact details provided below. We may need to verify your identity before processing certain requests.
            </p>
          </section>

          {/* Section 13: Third-Party Websites and Services */}
          <section className="flex flex-col gap-3 ">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">13</span>
              Third-Party Websites and Services
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              HomelyFoods.shop may contain links, payment interfaces or integrations provided by third parties.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              Homely Foods is not responsible for the privacy practices of third-party websites or services. We encourage you to review their respective privacy policies before providing information to them.
            </p>
          </section>

          {/* Section 14: Changes to This Privacy Policy */}
          <section className="flex flex-col gap-3 ">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0B392B] flex items-center justify-center text-xs font-bold shrink-0">14</span>
              Changes to This Privacy Policy
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              We may update this Privacy Policy from time to time to reflect changes in our services, technology, business practices or applicable laws.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              The updated version will be posted on HomelyFoods.shop with a revised effective date.
            </p>
          </section>

          {/* Section 15: Contact Us */}
          <section className="flex flex-col gap-4 bg-[#FAF6ED] p-6 rounded-2xl border border-[#E8E1D3]">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251C] flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#0B392B] text-white flex items-center justify-center text-xs font-bold shrink-0">15</span>
              Contact Us
            </h2>
            <p className="text-xs sm:text-sm text-gray-700">
              If you have questions, concerns or requests regarding this Privacy Policy or your personal information, please contact us:
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
              We will make reasonable efforts to respond to privacy-related requests in accordance with applicable law.
            </p>
          </section>

          {/* Acknowledgement Footer */}
          <div className="text-center pt-2 text-xs font-semibold text-gray-500 border-t border-gray-100">
            By using HomelyFoods.shop or creating an account, you acknowledge that you have read and understood this Privacy Policy.
          </div>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import PageSwitcher from "@/components/PageSwitcher";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Homely Foods - Pure Vegetarian & Homestyle Meals",
  description: "Authentic, pure-vegetarian meals delivered to your door.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className={`${poppins.className} text-[#0f261c] antialiased flex flex-col items-center justify-start sm:justify-center p-0 sm:p-4`}>
        <AuthProvider>
          <CartProvider>
            <PageSwitcher />
            <main className="mobile-viewport relative flex flex-col">
              {children}
            </main>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

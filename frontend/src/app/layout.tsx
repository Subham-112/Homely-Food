import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { SocketProvider } from "@/context/SocketContext";
import { PublicCartProvider } from "@/context/PublicCartContext";

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
      <body className={`${poppins.className} text-[#0f261c] antialiased bg-[#FAF6ED] min-h-screen`}>
        <AuthProvider>
          <PublicCartProvider>
            <SocketProvider>
              <CartProvider>
                <main className="mobile-viewport relative flex flex-col min-h-screen">
                  {children}
                </main>
              </CartProvider>
            </SocketProvider>
          </PublicCartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

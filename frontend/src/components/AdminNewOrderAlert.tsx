"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { BellRing, ChevronRight, X, Utensils, Phone, User, Receipt, Volume2, Sparkles } from "lucide-react";
import { useSocket } from "@/context/SocketContext";

export const AdminNewOrderAlert: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { socket, joinAdminRoom } = useSocket();

  const [newOrder, setNewOrder] = useState<any>(null);
  const [isPlayingSound, setIsPlayingSound] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // 1. Fetch & decode Web Audio buffer for /sound/Bell-ring.mp3 on mount
  useEffect(() => {
    const initWebAudio = async () => {
      try {
        const response = await fetch("/sound/Bell-ring.mp3");
        const arrayBuffer = await response.arrayBuffer();
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          audioCtxRef.current = ctx;
          const decoded = await ctx.decodeAudioData(arrayBuffer);
          audioBufferRef.current = decoded;
        }
      } catch (err) {
        console.warn("Web Audio API decode notice:", err);
      }
    };
    initWebAudio();
  }, []);



  // Start looping sound using both Web Audio API & HTML5 Audio fallback
  const startLoopingSound = () => {
    setIsPlayingSound(true);

    // Strategy 1: Web Audio API (Highly reliable, bypasses standard element blockers once context resumed)
    if (audioCtxRef.current && audioBufferRef.current) {
      try {
        if (audioCtxRef.current.state === "suspended") {
          audioCtxRef.current.resume();
        }
        if (sourceNodeRef.current) {
          try {
            sourceNodeRef.current.stop();
          } catch (_) {}
        }
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.loop = true;
        source.connect(audioCtxRef.current.destination);
        source.start(0);
        sourceNodeRef.current = source;
      } catch (err) {
        console.warn("Web Audio start error:", err);
      }
    }

    // Strategy 2: HTML5 Audio Tag
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        audioRef.current.loop = true;
        audioRef.current.play().catch((err) => {
          console.warn("Autoplay blocked by browser policy until user click:", err);
        });
      } catch (err) {
        console.error("HTML5 Audio error:", err);
      }
    }
  };

  // Stop looping sound on modal close/dismiss/view
  const stopLoopingSound = () => {
    setIsPlayingSound(false);

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      } catch (_) {}
    }

    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (_) {}
    }
  };

  // 3. Real-time socket listener for new orders
  useEffect(() => {
    if (!pathname.startsWith("/admin")) return;

    joinAdminRoom();

    if (!socket) return;

    const handleNewOrder = (incomingOrder: any) => {
      console.log("🔔 New Order socket event received in Admin Panel:", incomingOrder);
      if (incomingOrder?.createdBy === "admin") {
        console.log("ℹ️ Order created by Admin. Skipping alert modal and sound.");
        return;
      }
      setNewOrder(incomingOrder);
      startLoopingSound();
    };

    socket.on("order:new", handleNewOrder);

    return () => {
      socket.off("order:new", handleNewOrder);
    };
  }, [socket, pathname, joinAdminRoom]);

  // Test Order Trigger
  const handleTestOrderAlert = () => {
    const dummyOrder = {
      orderNumber: `ORD-TEST-${Math.floor(100 + Math.random() * 900)}`,
      guest: { name: "Sample Customer", phone: "9876543210" },
      totalAmount: 250,
      items: [
        { menuItem: { name: "Special Homely Thali" }, quantity: 1, price: 180 },
        { menuItem: { name: "Paneer Butter Masala" }, quantity: 1, price: 70 },
      ],
    };
    setNewOrder(dummyOrder);
    startLoopingSound();
  };

  const handleViewOrder = () => {
    stopLoopingSound();
    setNewOrder(null);
    window.dispatchEvent(new CustomEvent("admin:order-alert-dismissed"));
    router.push("/admin/orders");
  };

  const handleDismiss = () => {
    stopLoopingSound();
    setNewOrder(null);
    window.dispatchEvent(new CustomEvent("admin:order-alert-dismissed"));
  };

  const orderIdDisplay = newOrder?.orderNumber || newOrder?._id || "NEW ORDER";
  const customerName = newOrder?.guest?.name || newOrder?.user?.name || "Customer";
  const customerPhone = newOrder?.guest?.phone || newOrder?.user?.phone || "";
  const itemsCount = (newOrder?.items || []).reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);

  return (
    <>
      {/* HTML5 Audio Fallback Tag */}
      <audio
        ref={audioRef}
        src="/sound/Bell-ring.mp3"
        preload="auto"
        loop
        playsInline
      />

      {/* New Order Alert Modal */}
      {newOrder && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 border-2 border-emerald-500/30 relative animate-in zoom-in-95 duration-200">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#0B392B] via-emerald-800 to-teal-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0 ring-4 ring-white/20 animate-bounce">
                  <BellRing className="w-6 h-6 text-yellow-300 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-black tracking-widest uppercase text-yellow-300 block">
                    NEW ORDER RECEIVED!
                  </span>
                  <h2 className="text-lg font-extrabold tracking-tight font-poppins">
                    #{orderIdDisplay}
                  </h2>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
                title="Dismiss & Stop Sound"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Order Details */}
            <div className="flex flex-col gap-3 bg-[#FAF6ED] p-4 rounded-2xl border border-[#E8E1D3] text-xs">
              <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                <span className="text-gray-500 font-bold flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#0B392B]" /> Customer:
                </span>
                <span className="font-extrabold text-[#0B251C] text-sm">
                  {customerName}
                </span>
              </div>

              {customerPhone && (
                <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                  <span className="text-gray-500 font-bold flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-[#0B392B]" /> Mobile:
                  </span>
                  <span className="font-mono font-bold text-gray-800">
                    {customerPhone}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-gray-500 font-bold flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-[#0B392B]" /> Total Amount:
                </span>
                <span className="font-extrabold text-base text-[#0B392B]">
                  ₹{newOrder.totalAmount} ({itemsCount} {itemsCount === 1 ? "item" : "items"})
                </span>
              </div>
            </div>

            {/* Items Preview */}
            {newOrder.items && newOrder.items.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                  ORDER ITEMS PREVIEW
                </span>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200/70 flex flex-col gap-1.5 max-h-28 overflow-y-auto">
                  {newOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs font-semibold text-gray-700">
                      <span className="truncate pr-2">
                        • {item.menuItem?.name || item.name || "Item"} x {item.quantity}
                      </span>
                      <span className="font-bold text-[#0B251C]">
                        ₹{(item.price || 0) * (item.quantity || 1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleViewOrder}
                className="flex-1 bg-[#0B392B] hover:bg-[#07281E] text-white font-extrabold text-xs sm:text-sm py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group"
              >
                <Utensils className="w-4 h-4 text-yellow-300 group-hover:scale-110 transition-transform" />
                <span>View Order</span>
                <ChevronRight className="w-4 h-4 text-white" />
              </button>

              <button
                onClick={handleDismiss}
                className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-3.5 rounded-xl transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminNewOrderAlert;

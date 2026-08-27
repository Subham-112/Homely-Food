"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingBag, ChevronRight, X, Sparkles } from "lucide-react";
import { useSocket } from "@/context/SocketContext";
import { useAuth } from "@/context/AuthContext";
import { TokenStorage } from "@/utils/api";

export const CustomerReadyOrderAlert: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [readyOrder, setReadyOrder] = useState<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  // Setup Web Audio and one-time global interaction unlocker
  useEffect(() => {
    const initAudio = async () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass && !audioCtxRef.current) {
          const ctx = new AudioContextClass();
          audioCtxRef.current = ctx;
          const response = await fetch("/sound/Order-status-update.mp3");
          const arrayBuffer = await response.arrayBuffer();
          const decoded = await ctx.decodeAudioData(arrayBuffer);
          audioBufferRef.current = decoded;
        }
      } catch (err) {
        console.warn("Customer audio init notice:", err);
      }
    };
    initAudio();

    const unlockAudio = () => {
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      const el = audioRef.current;
      if (el) {
        el.play().then(() => {
          el.pause();
          el.currentTime = 0;
        }).catch(() => {});
      }
    };

    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  const playReadySound = () => {
    // Strategy 1: Web Audio API
    if (audioCtxRef.current && audioBufferRef.current) {
      try {
        if (audioCtxRef.current.state === "suspended") {
          audioCtxRef.current.resume();
        }
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.connect(audioCtxRef.current.destination);
        source.start(0);
      } catch (err) {
        console.warn("Web Audio play notice:", err);
      }
    }

    // Strategy 2: HTML5 Audio Tag
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((err) => {
          console.warn("Autoplay notice:", err);
        });
      } catch (err) {
        console.error("Audio playback error:", err);
      }
    }
  };

  // Helper to synchronously parse user ID from token
  const getStoredUserId = (): string | null => {
    try {
      const stored = TokenStorage.getToken();
      if (!stored) return null;
      const parts = stored.split(".");
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1]));
        return payload._id || payload.sub || payload.id || null;
      }
    } catch (_) {}
    return null;
  };

  // Real-time socket listener for order status updates
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    if (!socket) return;

    const handleStatusUpdate = (updatedOrder: any) => {
      console.log("📢 Customer Socket Event - Status Updated:", updatedOrder);
      const statusLower = (updatedOrder.status || "").toLowerCase();

      // Check if order belongs to currently logged in user or matching customer phone
      const orderUserId = updatedOrder.user?._id || updatedOrder.user;
      const orderPhone = updatedOrder.guest?.phone;
      const currentUserId = user?._id || getStoredUserId();
      const currentUserPhone = user?.phone;

      const isMyOrder =
        (currentUserId && orderUserId && String(orderUserId) === String(currentUserId)) ||
        (currentUserPhone && orderPhone && String(orderPhone) === String(currentUserPhone));

      // Trigger notification popup and sound ONLY when order status is "ready" AND it belongs to this user
      if (statusLower === "ready" && isMyOrder) {
        setReadyOrder(updatedOrder);
        playReadySound();
      }
    };

    socket.on("order:status_updated", handleStatusUpdate);

    return () => {
      socket.off("order:status_updated", handleStatusUpdate);
    };
  }, [socket, pathname, user]);

  const stopAudio = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (_) {}
    }
  };

  const handleTrackOrder = () => {
    stopAudio();
    const orderIdToTrack = readyOrder?.orderNumber || readyOrder?._id;
    setReadyOrder(null);
    if (orderIdToTrack) {
      router.push(`/order-tracking?orderId=${orderIdToTrack}`);
    } else {
      router.push("/orders");
    }
  };

  const handleDismiss = () => {
    stopAudio();
    setReadyOrder(null);
  };

  const orderIdDisplay = readyOrder?.orderNumber || readyOrder?._id || "";

  return (
    <>
      {/* Persistent HTML5 Audio Tag for /sound/Order-status-update.mp3 */}
      <audio
        ref={audioRef}
        src="/sound/Order-status-update.mp3"
        preload="auto"
        playsInline
      />

      {/* Customer Ready Status Notification Modal */}
      {readyOrder && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-5 border-2 border-emerald-500/30 relative animate-in zoom-in-95 duration-200">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white rounded-2xl p-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0 ring-4 ring-white/20 animate-bounce">
                  <ShoppingBag className="w-6 h-6 text-yellow-300" />
                </div>
                <div>
                  <span className="text-[10px] font-black tracking-widest uppercase text-yellow-300 block">
                    ORDER IS READY! 🍱
                  </span>
                  <h2 className="text-base sm:text-lg font-extrabold tracking-tight font-poppins">
                    #{orderIdDisplay}
                  </h2>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Details Card */}
            <div className="bg-[#F0FAF5] p-4 rounded-2xl border border-[#C8EFE0] flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
                <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>Your food is hot & ready for pickup / serving!</span>
              </div>
              <p className="text-gray-600 leading-snug">
                The kitchen has finished preparing your delicious homestyle meal.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleTrackOrder}
                className="flex-1 bg-[#0B392B] hover:bg-[#07281E] text-white font-extrabold text-xs sm:text-sm py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>Track Order</span>
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

export default CustomerReadyOrderAlert;

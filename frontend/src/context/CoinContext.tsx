"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getUserWallet, CoinWalletRecord } from "@/services/coinService";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";

interface CoinContextType {
  wallet: CoinWalletRecord | null;
  loading: boolean;
  floatingAnimation: { amount: number; id: number } | null;
  refreshWallet: () => Promise<void>;
}

const CoinContext = createContext<CoinContextType>({
  wallet: null,
  loading: true,
  floatingAnimation: null,
  refreshWallet: async () => {},
});

export const CoinProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [wallet, setWallet] = useState<CoinWalletRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [floatingAnimation, setFloatingAnimation] = useState<{ amount: number; id: number } | null>(null);

  const fetchWallet = async () => {
    if (!user) {
      setWallet(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getUserWallet();
      setWallet(data);
    } catch (err) {
      console.error("Failed to load user coin wallet:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [user]);

  useEffect(() => {
    if (!socket || !user) return;

    const triggerFloat = (gainedAmount: number) => {
      if (gainedAmount > 0) {
        const animId = Date.now();
        setFloatingAnimation({ amount: gainedAmount, id: animId });
        setTimeout(() => {
          setFloatingAnimation((current) => (current?.id === animId ? null : current));
        }, 1800);
      }
    };

    const handleCoinsCredited = (payload: any) => {
      if (payload?.amount) {
        triggerFloat(payload.amount);
      }
      fetchWallet();
    };

    const handleOrderStatusUpdated = (orderData: any) => {
      const s = orderData?.status?.toLowerCase();
      if (orderData?.coinReward?.amount) {
        triggerFloat(orderData.coinReward.amount);
      }
      if (s === "completed" || s === "delivered" || orderData?.coinReward) {
        fetchWallet();
      }
    };

    socket.on("coins:credited", handleCoinsCredited);
    socket.on("order:status_updated", handleOrderStatusUpdated);
    return () => {
      socket.off("coins:credited", handleCoinsCredited);
      socket.off("order:status_updated", handleOrderStatusUpdated);
    };
  }, [socket, user]);

  return (
    <CoinContext.Provider value={{ wallet, loading, floatingAnimation, refreshWallet: fetchWallet }}>
      {children}
    </CoinContext.Provider>
  );
};

export const useCoins = () => useContext(CoinContext);

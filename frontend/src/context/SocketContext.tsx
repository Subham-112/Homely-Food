"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { TokenStorage } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinAdminRoom: () => void;
  joinOrderRoom: (orderId: string) => void;
  leaveOrderRoom: (orderId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinAdminRoom: () => {},
  joinOrderRoom: () => {},
  leaveOrderRoom: () => {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, adminToken } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Active token from AuthContext or TokenStorage
    const activeToken = adminToken || token || TokenStorage.getAdminToken() || TokenStorage.getToken();

    // Connect ONLY if a valid JWT token exists
    if (!activeToken || !activeToken.trim()) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setIsConnected(false);
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

    const socketInstance = io(socketUrl, {
      transports: ["websocket", "polling"],
      auth: {
        token: activeToken,
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
    });

    socketInstance.on("connect", () => {
      setIsConnected(true);
      // Automatically join admin room if admin token exists
      const currentAdminToken = adminToken || TokenStorage.getAdminToken();
      if (currentAdminToken) {
        socketInstance.emit("join:admin");
      }
    });

    socketInstance.on("socket:authenticated", (data: { role: string; name: string }) => {
      console.log(`🔐 Authenticated Socket connected (role: ${data.role}, name: ${data.name})`);
      if (data.role === "admin") {
        socketInstance.emit("join:admin");
      }
    });

    socketInstance.on("disconnect", () => {
      console.log("❌ Disconnected from Socket.io Server");
      setIsConnected(false);
    });

    socketInstance.on("socket:error", (err: any) => {
      console.warn("⛔ Socket Error:", err?.message || err);
    });

    socketInstance.on("connect_error", (err) => {
      console.warn("⚠️ Socket Authentication/Connection Error:", err.message);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token, adminToken]);

  const joinAdminRoom = React.useCallback(() => {
    if (socket) {
      socket.emit("join:admin");
    }
  }, [socket]);

  const joinOrderRoom = React.useCallback((orderId: string) => {
    if (socket && orderId) {
      socket.emit("join:order", orderId);
    }
  }, [socket]);

  const leaveOrderRoom = React.useCallback((orderId: string) => {
    if (socket && orderId) {
      socket.emit("leave:order", orderId);
    }
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinAdminRoom,
        joinOrderRoom,
        leaveOrderRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

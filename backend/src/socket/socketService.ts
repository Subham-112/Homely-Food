import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import winston from "winston";
import { config } from "../config/config";
import User from "../models/user.model";
import Admin from "../models/admin.model";

let io: Server | null = null;

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.printf(({ level, message }) => `${level}: ${message}`)
  ),
  transports: [new winston.transports.Console()],
});

export interface AuthenticatedSocket extends Socket {
  user?: {
    _id: string;
    role: "admin" | "user";
    name: string;
    email?: string;
  };
}

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
      credentials: true,
    },
  });

  // Strict JWT Authentication Middleware for Socket.io
  io.use(async (socket: AuthenticatedSocket, next) => {
    const rawToken =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!rawToken || !rawToken.trim()) {
      logger.warn(`⛔ Socket rejected connection request from ${socket.id}: Access token missing`);
      return next(new Error("Authentication error: Access token missing"));
    }

    try {
      const decoded = jwt.verify(rawToken, config.jwt.secret) as {
        _id?: string;
        role?: string;
        email?: string;
        sub?: string;
      };

      const userId = decoded._id || decoded.sub;
      if (!userId) {
        return next(new Error("Authentication error: Malformed token"));
      }

      const role = (decoded.role === "admin" ? "admin" : "user") as "admin" | "user";
      let userName = "Unknown User";

      if (role === "admin") {
        const adminDoc = await Admin.findById(userId).select("name email status").lean();
        if (!adminDoc || adminDoc.status !== "active") {
          return next(new Error("Authentication error: Admin account inactive or not found"));
        }
        userName = adminDoc.name || "System Admin";
      } else {
        const userDoc = await User.findById(userId).select("name email status").lean();
        if (!userDoc || userDoc.status !== "active") {
          return next(new Error("Authentication error: User account inactive or not found"));
        }
        userName = userDoc.name || "Customer";
      }

      socket.user = {
        _id: userId,
        role,
        name: userName,
        email: decoded.email,
      };

      next();
    } catch (err) {
      logger.warn(`⛔ Socket rejected connection request from ${socket.id}: ${(err as Error).message}`);
      return next(new Error("Authentication error: Invalid or expired token"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    const role = socket.user?.role || "user";
    const name = socket.user?.name || "Unknown";

    // Required Console Log Format
    console.log(`🔐 Authenticated Socket connected (role: ${role}, name: ${name})`);

    // Notify connected client with their verified identity details
    socket.emit("socket:authenticated", {
      role,
      name,
    });

    // Protected Admin Room Subscription
    socket.on("join:admin", () => {
      if (socket.user?.role !== "admin") {
        logger.warn(`⛔ Forbidden join:admin attempt by socket ${socket.id} (name: ${name}, role: ${role})`);
        socket.emit("socket:error", { message: "Forbidden: Admin role required to join admin room" });
        return;
      }
      if (!socket.rooms.has("admin_room")) {
        socket.join("admin_room");
        logger.info(`👑 Authenticated Admin Socket ${socket.id} (${name}) joined admin_room`);
      }
    });

    // Join Order Tracking Room (For order updates)
    socket.on("join:order", async (orderId: string) => {
      if (!orderId) return;
      const cleanOrderId = orderId.trim();
      const roomName = `order_${cleanOrderId}`;

      socket.join(roomName);
      logger.info(`📦 Socket ${socket.id} (${name}) joined ${roomName}`);
    });

    // Leave Order Tracking Room
    socket.on("leave:order", (orderId: string) => {
      if (orderId) {
        const roomName = `order_${orderId.trim()}`;
        socket.leave(roomName);
        logger.info(`👋 Socket ${socket.id} (${name}) left ${roomName}`);
      }
    });

    socket.on("disconnect", () => {
      logger.info(`❌ Client disconnected: ${socket.id} (role: ${role}, name: ${name})`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.io has not been initialized!");
  }
  return io;
};

// --- Helper Functions to Emit Events ---

export const emitNewOrder = (orderData: any) => {
  if (io) {
    io.to("admin_room").emit("order:new", orderData);
    logger.info(`📢 Emitted 'order:new' to admin_room for order #${orderData?.orderNumber}`);
  }
};

export const emitOrderStatusUpdate = (orderData: any) => {
  if (io && orderData) {
    const orderId = orderData.orderNumber || orderData._id;
    if (orderId) {
      io.to(`order_${orderId}`).emit("order:status_updated", orderData);
    }
    if (orderData._id) {
      io.to(`order_${orderData._id}`).emit("order:status_updated", orderData);
    }
    io.to("admin_room").emit("order:status_updated", orderData);
    io.emit("order:status_updated", orderData);
    logger.info(`📢 Emitted 'order:status_updated' for order #${orderId} (Status: ${orderData.status})`);
  }
};

export const emitMenuItemUpdate = (itemData: any) => {
  if (io) {
    io.emit("menu:item_updated", itemData);
    logger.info(`📢 Emitted 'menu:item_updated' for item ${itemData?._id}`);
  }
};

export const emitCoinsCredited = (userId: string, payload: any) => {
  if (io) {
    io.to(`user_${userId}`).emit("coins:credited", payload);
    logger.info(`📢 Emitted 'coins:credited' for user ${userId} (+${payload.amount} coins)`);
  }
};


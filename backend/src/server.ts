import http from "http";
import app from "./app";
import { connectDB } from "./config/database";
import { config } from "./config/config";
import { logger } from "./config/logger";
import { initSocket } from "./socket/socketService";

const startServer = async () => {
  try {
    await connectDB();
    const server = http.createServer(app);
    initSocket(server);

    server.listen(config.port, () => {
      logger.info(`Server is running on port ${config.port} in ${config.env} mode (with Socket.io support)`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

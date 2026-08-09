import app from "./app";
import { connectDB } from "./config/database";
import { config } from "./config/config";
import { logger } from "./config/logger";

const startServer = async () => {
  try {
    await connectDB();
    app.listen(config.port, () => {
      logger.info(`Server is running on port ${config.port} in ${config.env} mode`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

import http from "http";
import app from "./app";
import { connectDB } from "./config/database";
import { config } from "./config/config";
import { logger } from "./config/logger";
import { initSocket } from "./socket/socketService";

import { expirePendingPaymentsJob } from "./jobs/expirePendingPayments.job";
import { initCoinExpiryJob } from "./jobs/coinExpiry.job";
import { CoinRuleService } from "./modules/coin/coinRule.service";

const startServer = async () => {
  try {
    await connectDB();
    await CoinRuleService.seedDefaultRules();

    const server = http.createServer(app);
    initSocket(server);

    // Run expire pending payments sweeper every 5 minutes
    setInterval(expirePendingPaymentsJob, 5 * 60 * 1000);

    // Initialize daily coin expiry cron job
    initCoinExpiryJob();

    server.listen(config.port, () => {
      logger.info(`Server is running on port ${config.port} in ${config.env} mode (with Socket.io support)`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

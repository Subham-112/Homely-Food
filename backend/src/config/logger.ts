import "colors";
import winston from "winston";
import path from "path";
import { config } from "./config";

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), "logs");

// Custom format for console with colors
const consoleFormat = winston.format.combine(
  winston.format.timestamp({
    format: () => {
      const now = new Date();
      return now.toLocaleString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
    },
  }),
  winston.format.printf((info: winston.Logform.TransformableInfo) => {
    const { timestamp, level, message, ...meta } = info;
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    const ts = String(timestamp);
    return `${ts.grey} ${level.yellow}: ${message}${metaStr}`;
  }),
);

// JSON format for file logging
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const logger = winston.createLogger({
  level: config.env === "production" ? "info" : "debug",
  format: fileFormat,
  transports: [
    // Console transport with colors
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // Combined logs (all levels)
    new winston.transports.File({
      filename: path.join(logsDir, "app-combined.log"),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // Error logs only
    new winston.transports.File({
      filename: path.join(logsDir, "app-error.log"),
      level: "error",
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // Info logs only
    new winston.transports.File({
      filename: path.join(logsDir, "app-info.log"),
      level: "info",
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
  ],
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, "exceptions.log"),
      maxsize: 10485760,
      maxFiles: 5,
    }),
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, "rejections.log"),
      maxsize: 10485760,
      maxFiles: 5,
    }),
  ],
});

export { logger };

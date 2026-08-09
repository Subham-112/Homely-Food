import express from "express";
import colors from "colors";
import cors from "cors";
import cookieParser from "cookie-parser";
import { logger } from "./config/logger";
import { config } from "./config/config";
import { corsOptions } from "./middlewares/corsMiddleware";
import apiRoutes from "./routes/index";
import { globalErrorHandler } from "./middlewares/errorHandler";

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (config.cors.enabled) app.use(cors(corsOptions));
else console.log("⚠️  CORS is disabled by config");

app.use(
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const startTime = process.hrtime();

    // Save original json method
    const originalJson = res.json.bind(res);

    // Capture response body
    res.json = (body: any) => {
      res.locals.responseBody = body;
      return originalJson(body);
    };

    res.on("finish", () => {
      const diff = process.hrtime(startTime);
      const responseTime = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

      const fetchStatus = () => {
        if (res.statusCode >= 500) return colors.red(`${res.statusCode}`);
        if (res.statusCode >= 400) return colors.yellow(`${res.statusCode}`);
        if (res.statusCode >= 300) return colors.cyan(`${res.statusCode}`);
        if (res.statusCode >= 200) return colors.green(`${res.statusCode}`);
        return colors.white(`${res.statusCode}`);
      };

      const message = res.locals.responseBody?.message;

      logger.info(
        `${"METHOD:".blue} ${req.method.yellow} - ` +
          `${"URL:".blue} ${req.originalUrl.yellow} - ` +
          `${"STATUS:".blue} ${fetchStatus()} - ` +
          `${"MESSAGE:".blue} ${(message ?? "-").white} - ` +
          `${"Response Time:".blue} ${responseTime.magenta} ${"ms".magenta}`
      );
    });

    next();
  }
);

app.get("/", (_, res) => {
  res.send("Homely Food API Running 🚀");
});

app.use("/api", apiRoutes);
app.use(globalErrorHandler);

export default app;

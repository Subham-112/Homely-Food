import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { IdempotencyKey, IdempotencyStatus } from "../models/idempotencyKey.model";
import ApiError from "../utils/ApiError";
import { logger } from "../config/logger";

/**
 * Computes a SHA-256 fingerprint hash of the request body.
 */
export const computePayloadFingerprint = (body: any): string => {
  if (!body) return crypto.createHash("sha256").update("").digest("hex");
  // Sort object keys recursively to ensure deterministic hash regardless of key order
  const canonicalString = JSON.stringify(body, Object.keys(body || {}).sort());
  return crypto.createHash("sha256").update(canonicalString).digest("hex");
};

export interface IIdempotencyOptions {
  required?: boolean;
  ttlHours?: number;
}

/**
 * Express middleware for request idempotency & payload fingerprinting.
 */
export const idempotencyMiddleware = (options: IIdempotencyOptions = {}) => {
  const isRequired = options.required ?? false;
  const ttlHours = options.ttlHours || 24;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only apply idempotency to mutating HTTP methods
    if (!["POST", "PUT", "PATCH"].includes(req.method.toUpperCase())) {
      return next();
    }

    const idempotencyKey = (
      req.headers["idempotency-key"] ||
      req.headers["x-idempotency-key"]
    ) as string | undefined;

    if (!idempotencyKey || !idempotencyKey.trim()) {
      if (isRequired) {
        return next(new ApiError(400, "Idempotency-Key header is required for this operation."));
      }
      return next();
    }

    const key = idempotencyKey.trim();
    const currentPayloadHash = computePayloadFingerprint(req.body);
    const userId = (req as any).user?._id;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);

    try {
      // Check existing record
      const existingRecord = await IdempotencyKey.findOne({ key });

      if (existingRecord) {
        // Payload Fingerprint Check
        if (existingRecord.payloadHash !== currentPayloadHash) {
          logger.warn(
            `Idempotency key payload mismatch for key "${key}". Original hash: ${existingRecord.payloadHash}, new hash: ${currentPayloadHash}`
          );
          res.status(422).json({
            success: false,
            statusCode: 422,
            message: "Unprocessable Entity: Payload fingerprint mismatch. The request parameters differ from the original request.",
          });
          return;
        }

        // If previous request was completed, return cached response directly
        if (existingRecord.status === IdempotencyStatus.COMPLETED) {
          res.setHeader("Idempotency-Replayed", "true");
          res.status(existingRecord.statusCode || 200).json(existingRecord.responseBody);
          return;
        }

        // If previous request is still pending
        if (existingRecord.status === IdempotencyStatus.PENDING) {
          res.status(409).json({
            success: false,
            statusCode: 409,
            message: "Conflict: A request with this idempotency key is currently in progress. Please retry shortly.",
          });
          return;
        }
      }

      // Reserve the key as PENDING
      let reservedRecord;
      try {
        reservedRecord = await IdempotencyKey.create({
          key,
          path: req.originalUrl || req.path,
          userId: userId ? userId : undefined,
          payloadHash: currentPayloadHash,
          status: IdempotencyStatus.PENDING,
          expiresAt,
        });
      } catch (err: any) {
        // Race condition: another concurrent request just inserted the key
        if (err.code === 11000) {
          res.status(409).json({
            success: false,
            statusCode: 409,
            message: "Conflict: Concurrent request with same idempotency key in progress.",
          });
          return;
        }
        throw err;
      }

      // Intercept the response to store the result on completion
      const originalJson = res.json.bind(res);
      res.json = function (body: any): Response {
        const statusCode = res.statusCode;

        // Asynchronously save response
        IdempotencyKey.findByIdAndUpdate(reservedRecord._id, {
          $set: {
            status: statusCode < 500 ? IdempotencyStatus.COMPLETED : IdempotencyStatus.FAILED,
            statusCode,
            responseBody: body,
          },
        }).catch((updateErr) => {
          logger.error(`Failed to update idempotency key record for key "${key}":`, updateErr);
        });

        return originalJson(body);
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default idempotencyMiddleware;

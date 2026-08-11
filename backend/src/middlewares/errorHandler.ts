import { logger } from "../config/logger";
import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";

/**
 * Parse MongoDB duplicate key error to extract field name and value
 */
const parseDuplicateKeyError = (
  err: any
): { field: string; value: string } | null => {
  if (err.code !== 11000 && err.name !== "MongoServerError") {
    return null;
  }

  if (err.keyPattern) {
    const field = Object.keys(err.keyPattern)[0];
    const value = err.keyValue?.[field] || "unknown";
    return { field, value };
  }

  const match = err.message?.match(
    /index: (\w+)_\d+ dup key: \{ (\w+): "(.+)" \}/
  );
  if (match) {
    return { field: match[2], value: match[3] };
  }

  return null;
};

/**
 * Get user-friendly message for duplicate key errors
 */
const getDuplicateKeyMessage = (field: string, value: string): string => {
  const fieldMessages: Record<string, string> = {
    email: `An account with the email "${value}" already exists. Please login or use a different email.`,
    phone: `An account with the phone number "${value}" already exists. Please login or use a different phone number.`,
    fcmToken: "This device is already registered with another account.",
  };

  return (
    fieldMessages[field] ||
    `A record with this ${field} already exists. Please use a different value.`
  );
};

/**
 * Handle Mongoose validation errors
 */
const parseValidationError = (err: any): string | null => {
  if (err.name !== "ValidationError" || !err.errors) {
    return null;
  }

  const messages = Object.values(err.errors).map((e: any) => e.message);
  return messages.join(". ");
};

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (res.headersSent) {
    next(err);
    return;
  }

  let error = err;

  if (!(error instanceof ApiError)) {
    let statusCode = error.statusCode || error.status || 500;
    let message = error.message || "Internal Server Error";

    if (error.code === 11000 || error.name === "MongoServerError") {
      const duplicateInfo = parseDuplicateKeyError(error);
      if (duplicateInfo) {
        statusCode = 409;
        message = getDuplicateKeyMessage(duplicateInfo.field, duplicateInfo.value);
      }
    }

    const validationMessage = parseValidationError(error);
    if (validationMessage) {
      statusCode = 400;
      message = validationMessage;
    }

    if (error.name === "CastError") {
      statusCode = 400;
      message = `Invalid ${error.path}: ${error.value}`;
    }

    if (statusCode >= 500) {
      message = "Something went wrong. Try again later";
    }

    error = new ApiError(statusCode, message, null, error.error || error.errors || [], error.stack);
  } else if (error.statusCode >= 500) {
    error.message = "Something went wrong. Try again later";
  }

  logger.error(
    `[${new Date().toISOString()}] Error on ${req.method} ${req.originalUrl} - Status: ${error.statusCode} - Message: ${err.message || error.message}`,
    { stack: error.stack }
  );

  res.status(error.statusCode).json(error.toJSON());
};

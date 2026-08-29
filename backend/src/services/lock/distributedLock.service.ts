import crypto from "crypto";
import { DistributedLock } from "../../models/distributedLock.model";
import ApiError from "../../utils/ApiError";
import { logger } from "../../config/logger";

export interface ILockOptions {
  ttlSeconds?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export class DistributedLockService {
  /**
   * Attempts to acquire an atomic distributed lock on a given resource.
   * Returns a lock token if acquired, or null if resource is currently locked by another worker.
   */
  public static async acquireLock(
    resource: string,
    ttlSeconds: number = 30
  ): Promise<string | null> {
    const token = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    try {
      // 1. Try to insert new lock
      await DistributedLock.create({
        resource,
        token,
        acquiredAt: now,
        expiresAt,
      });
      return token;
    } catch (err: any) {
      // Duplicate key error (E11000) means lock already exists
      if (err.code === 11000) {
        // Check if existing lock is expired and can be atomically taken over
        const result = await DistributedLock.findOneAndUpdate(
          {
            resource,
            expiresAt: { $lte: now },
          },
          {
            $set: {
              token,
              acquiredAt: now,
              expiresAt,
            },
          },
          { new: true }
        );

        if (result && result.token === token) {
          return token;
        }
      }
      return null;
    }
  }

  /**
   * Releases an acquired lock only if the token matches the current lock holder.
   */
  public static async releaseLock(resource: string, token: string): Promise<boolean> {
    try {
      const result = await DistributedLock.deleteOne({
        resource,
        token,
      });
      return result.deletedCount > 0;
    } catch (err) {
      logger.error(`Error releasing lock for resource "${resource}":`, err);
      return false;
    }
  }

  /**
   * Executes a task within a distributed lock boundary, ensuring lock acquisition
   * and safe release inside a finally block.
   */
  public static async withLock<T>(
    resource: string,
    options: ILockOptions | number,
    fn: () => Promise<T>
  ): Promise<T> {
    const config: ILockOptions = typeof options === "number" ? { ttlSeconds: options } : options;
    const ttlSeconds = config.ttlSeconds || 30;
    const maxRetries = config.maxRetries || 0;
    const retryDelayMs = config.retryDelayMs || 250;

    let token: string | null = null;
    let attempts = 0;

    while (attempts <= maxRetries) {
      token = await this.acquireLock(resource, ttlSeconds);
      if (token) {
        break;
      }
      attempts++;
      if (attempts <= maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }

    if (!token) {
      throw new ApiError(
        409,
        `Concurrent operation in progress for resource "${resource}". Please retry in a moment.`
      );
    }

    try {
      return await fn();
    } finally {
      await this.releaseLock(resource, token);
    }
  }
}

export default DistributedLockService;

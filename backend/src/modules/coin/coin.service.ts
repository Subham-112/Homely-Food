import mongoose from "mongoose";
import { CoinWallet, ICoinWallet } from "../../models/coinWallet.model";
import { CoinTransaction, ICoinTransaction } from "../../models/coinTransaction.model";
import { Order } from "../../models/order.model";
import User from "../../models/user.model";
import { CoinTransactionType, CoinTransactionDirection, OrderStatus } from "../../common/enum";
import { CoinConfigService } from "./coinConfig.service";
import { CoinRuleService } from "./coinRule.service";
import { emitCoinsCredited } from "../../socket/socketService";
import ApiError from "../../utils/ApiError";

export class CoinService {
  public static async getOrCreateWallet(userId: string): Promise<ICoinWallet> {
    let wallet = await CoinWallet.findOne({ user: userId });
    if (!wallet) {
      wallet = await CoinWallet.create({
        user: userId,
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        lifetimeExpired: 0,
        achievedTierIds: [],
        nextExpiryCheckAt: null,
      });
    }
    return wallet;
  }

  public static async creditWallet(
    userId: string,
    amount: number,
    options: {
      type: CoinTransactionType;
      reason: string;
      orderId?: string;
      tierId?: string;
      adminId?: string;
      meta?: Record<string, any>;
    }
  ): Promise<{ wallet: ICoinWallet; transaction: ICoinTransaction }> {
    if (amount <= 0) {
      throw new ApiError(400, "Credit amount must be greater than zero.");
    }

    const config = await CoinConfigService.getConfig();
    const expiryDays = config.expiryInactivityDays || 30;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let wallet = await CoinWallet.findOne({ user: userId }).session(session);
      if (!wallet) {
        wallet = new CoinWallet({
          user: userId,
          balance: 0,
          lifetimeEarned: 0,
          achievedTierIds: [],
        });
      }

      if (!wallet.isActive) {
        throw new ApiError(400, "Coin wallet is disabled for this user.");
      }

      const wasZero = wallet.balance === 0;
      wallet.balance += amount;
      wallet.lifetimeEarned += amount;
      wallet.lastCreditedAt = new Date();

      if (wasZero || config.extendExpiryOnEarn) {
        const nextExpiry = new Date();
        nextExpiry.setDate(nextExpiry.getDate() + expiryDays);
        wallet.nextExpiryCheckAt = nextExpiry;
      }

      if (options.tierId && !wallet.achievedTierIds.some((id) => id.toString() === options.tierId)) {
        wallet.achievedTierIds.push(options.tierId as any);
      }

      await wallet.save({ session });

      const transaction = new CoinTransaction({
        user: userId,
        type: options.type,
        direction: CoinTransactionDirection.CREDIT,
        amount,
        balanceAfter: wallet.balance,
        order: options.orderId,
        tier: options.tierId,
        performedByAdmin: options.adminId,
        reason: options.reason,
        meta: options.meta,
      });

      await transaction.save({ session });

      await session.commitTransaction();
      session.endSession();

      try {
        emitCoinsCredited(userId.toString(), {
          amount,
          type: options.type,
          balance: wallet.balance,
          reason: options.reason,
        });
      } catch (err) {
        console.error("Failed to emit coins:credited socket event:", err);
      }

      return { wallet, transaction };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  public static async debitWallet(
    userId: string,
    amount: number,
    options: {
      type: CoinTransactionType;
      reason: string;
      orderId?: string;
      adminId?: string;
      meta?: Record<string, any>;
    }
  ): Promise<{ wallet: ICoinWallet; transaction: ICoinTransaction }> {
    if (amount <= 0) {
      throw new ApiError(400, "Debit amount must be greater than zero.");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const wallet = await CoinWallet.findOne({ user: userId }).session(session);
      if (!wallet) {
        throw new ApiError(404, "Coin wallet not found.");
      }

      if (!wallet.isActive) {
        throw new ApiError(400, "Coin wallet is disabled for this user.");
      }

      if (wallet.balance < amount) {
        throw new ApiError(400, `Insufficient coin balance. Available: ${wallet.balance}, Required: ${amount}`);
      }

      wallet.balance -= amount;
      wallet.lifetimeSpent += amount;
      await wallet.save({ session });

      const transaction = new CoinTransaction({
        user: userId,
        type: options.type || CoinTransactionType.SPENT,
        direction: CoinTransactionDirection.DEBIT,
        amount,
        balanceAfter: wallet.balance,
        order: options.orderId,
        performedByAdmin: options.adminId,
        reason: options.reason,
        meta: options.meta,
      });

      await transaction.save({ session });

      await session.commitTransaction();
      session.endSession();

      return { wallet, transaction };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  public static async grantWelcomeBonus(userId: string): Promise<void> {
    try {
      const config = await CoinConfigService.getConfig();
      if (!config.isCoinSystemEnabled || config.welcomeBonusCoins <= 0) return;

      const existingTx = await CoinTransaction.findOne({
        user: userId,
        type: CoinTransactionType.WELCOME_BONUS,
      });
      if (existingTx) return;

      await this.creditWallet(userId, config.welcomeBonusCoins, {
        type: CoinTransactionType.WELCOME_BONUS,
        reason: "Welcome Discount Bonus",
      });

      await User.findByIdAndUpdate(userId, { welcomeRewardClaimed: true });
    } catch (err) {
      console.error("Welcome bonus error:", err);
    }
  }

  public static async awardOrderCoins(userId: string, orderId: string, netOrderAmount: number): Promise<{ wallet: ICoinWallet; transaction: ICoinTransaction } | null> {
    try {
      const config = await CoinConfigService.getConfig();
      if (!config.isCoinSystemEnabled) return null;

      const existingTx = await CoinTransaction.findOne({
        order: orderId,
        type: { $in: [CoinTransactionType.ORDER_REWARD_FIXED, CoinTransactionType.ORDER_REWARD_PERCENT] },
      });
      if (existingTx) return null;

      const tier = await CoinRuleService.resolveTier(netOrderAmount);
      if (!tier) return null;

      const coinsToAward = tier.fixedCoins;
      const txnType = CoinTransactionType.ORDER_REWARD_FIXED;
      const reason = "Earned Cash Savings";
      const tierId = tier._id?.toString();

      if (coinsToAward <= 0) return null;

      const result = await this.creditWallet(userId, coinsToAward, {
        type: txnType,
        reason,
        orderId,
        tierId,
        meta: { netOrderAmount },
      });
      return result;
    } catch (err) {
      console.error("Order coins awarding error:", err);
      return null;
    }
  }

  public static async adminGrantCoins(
    adminId: string,
    userIds: string[],
    amount: number,
    reason?: string
  ): Promise<{ succeeded: string[]; failed: { userId: string; error: string }[] }> {
    if (amount <= 0) {
      throw new ApiError(400, "Grant amount must be greater than zero.");
    }

    const grantReason = (reason && reason.trim()) ? reason.trim() : "Manual Admin Bonus";

    const succeeded: string[] = [];
    const failed: { userId: string; error: string }[] = [];

    for (const uid of userIds) {
      try {
        await this.creditWallet(uid, amount, {
          type: CoinTransactionType.ADMIN_GRANT,
          reason: `Admin Bonus: ${grantReason}`,
          adminId,
        });
        succeeded.push(uid);
      } catch (err: any) {
        failed.push({ userId: uid, error: err.message || "Failed to grant coins" });
      }
    }

    return { succeeded, failed };
  }

  public static async getUserHistory(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      CoinTransaction.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("order", "orderNumber totalAmount status"),
      CoinTransaction.countDocuments({ user: userId }),
    ]);

    return {
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public static async getAdminWallets(search: string = "", page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const matchFilter: any = {};

    const [wallets, total] = await Promise.all([
      CoinWallet.find(matchFilter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name phone email"),
      CoinWallet.countDocuments(matchFilter),
    ]);

    return {
      wallets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public static async getAdminAnalytics() {
    const [totalsResult, walletCount, activeWalletCount] = await Promise.all([
      CoinTransaction.aggregate([
        {
          $group: {
            _id: "$type",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
      CoinWallet.countDocuments(),
      CoinWallet.countDocuments({ balance: { $gt: 0 } }),
    ]);

    const stats: Record<string, { totalAmount: number; count: number }> = {};
    totalsResult.forEach((res) => {
      stats[res._id] = { totalAmount: res.totalAmount, count: res.count };
    });

    return {
      walletCount,
      activeWalletCount,
      welcomeBonusTotal: stats[CoinTransactionType.WELCOME_BONUS]?.totalAmount || 0,
      orderRewardsTotal:
        (stats[CoinTransactionType.ORDER_REWARD_FIXED]?.totalAmount || 0) +
        (stats[CoinTransactionType.ORDER_REWARD_PERCENT]?.totalAmount || 0),
      adminGrantsTotal: stats[CoinTransactionType.ADMIN_GRANT]?.totalAmount || 0,
      expiredTotal: stats[CoinTransactionType.EXPIRED]?.totalAmount || 0,
    };
  }
}

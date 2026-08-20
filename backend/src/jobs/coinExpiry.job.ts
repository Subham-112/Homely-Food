import cron from "node-cron";
import { CoinWallet } from "../models/coinWallet.model";
import { CoinTransaction } from "../models/coinTransaction.model";
import { CoinTransactionType, CoinTransactionDirection } from "../common/enum";
import mongoose from "mongoose";

export function initCoinExpiryJob(): void {
  // Run daily at midnight IST (00:00:00)
  cron.schedule("0 0 * * *", async () => {
    console.log("[CRON] Running daily coin expiry sweep...");
    try {
      const now = new Date();
      const expiredWalletsCursor = CoinWallet.find({
        balance: { $gt: 0 },
        nextExpiryCheckAt: { $lte: now },
      }).cursor({ batchSize: 200 });

      let processedCount = 0;
      let totalExpiredCoins = 0;

      for await (const wallet of expiredWalletsCursor) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
          const expiredAmount = wallet.balance;
          wallet.balance = 0;
          wallet.lifetimeExpired += expiredAmount;
          wallet.nextExpiryCheckAt = null;
          wallet.lastDebitedAt = new Date();

          await wallet.save({ session });

          const tx = new CoinTransaction({
            user: wallet.user,
            type: CoinTransactionType.EXPIRED,
            direction: CoinTransactionDirection.DEBIT,
            amount: expiredAmount,
            balanceAfter: 0,
            reason: "Coins expired after 30 days of inactivity",
          });

          await tx.save({ session });

          await session.commitTransaction();
          session.endSession();

          processedCount++;
          totalExpiredCoins += expiredAmount;
        } catch (err) {
          await session.abortTransaction();
          session.endSession();
          console.error(`[CRON] Error expiring coins for wallet ${wallet._id}:`, err);
        }
      }

      console.log(
        `[CRON] Coin expiry sweep completed. Expired ${totalExpiredCoins} coins across ${processedCount} wallets.`
      );
    } catch (error) {
      console.error("[CRON] Fatal error in coin expiry sweep:", error);
    }
  });
}

import cron from "node-cron";
import mongoose from "mongoose";
import { LeaderboardConfig } from "../models/leaderboardConfig.model";
import { CustomerLeaderboardProgress } from "../models/customerLeaderboardProgress.model";
import { Order } from "../models/order.model";
import { LeaderboardService } from "../modules/leaderboard/leaderboard.service";
import { LeaderboardRewardDispatcher } from "../modules/leaderboard/leaderboardReward.dispatcher";
import { LeaderboardPeriod, OrderStatus } from "../common/enum";

/**
 * Daily Midnight Job (Runs at 00:05:00 IST / 18:35:00 UTC)
 * Evaluates:
 * 1. Daily order streaks (consecutiveOrderDays)
 * 2. Position maintenance (consecutiveDaysAtCurrentRank)
 * 3. Automatic idempotent reward dispatch for qualified customers
 */
export function initLeaderboardDailyJob(): void {
  // Run daily at 00:05 IST (which is 18:35 UTC previous day)
  cron.schedule("35 18 * * *", async () => {
    console.log("[CRON] Starting Daily Leaderboard Streak & Position Maintenance Evaluation...");
    try {
      await runLeaderboardDailyEvaluation();
    } catch (error) {
      console.error("[CRON] Fatal error in Daily Leaderboard Evaluation:", error);
    }
  });
}

export async function runLeaderboardDailyEvaluation(): Promise<void> {
  const config = await LeaderboardConfig.findOne();
  if (!config || !config.isActive) {
    console.log("[CRON] Leaderboard is inactive or not configured. Skipping.");
    return;
  }

  // 1. Synchronize rankings for all periods first
  await LeaderboardService.syncLeaderboardProgress(LeaderboardPeriod.WEEKLY);
  await LeaderboardService.syncLeaderboardProgress(LeaderboardPeriod.MONTHLY);

  // 2. Calculate Yesterday's boundary in IST (00:00:00 to 23:59:59.999 IST)
  const now = new Date();
  const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const istDate = new Date(istString);

  // Yesterday in IST
  const yesterdayIST = new Date(istDate);
  yesterdayIST.setDate(yesterdayIST.getDate() - 1);
  const yYear = yesterdayIST.getFullYear();
  const yMonth = yesterdayIST.getMonth();
  const yDay = yesterdayIST.getDate();

  const yesterdayStartIST = new Date(yYear, yMonth, yDay, 0, 0, 0, 0);
  const yesterdayEndIST = new Date(yYear, yMonth, yDay, 23, 59, 59, 999);

  const yesterdayStartUTC = new Date(yesterdayStartIST.getTime() - 5.5 * 3600000);
  const yesterdayEndUTC = new Date(yesterdayEndIST.getTime() - 5.5 * 3600000);

  const yesterdayDateKey = `${yYear}-${String(yMonth + 1).padStart(2, "0")}-${String(yDay).padStart(2, "0")}`;

  // Find all customers who placed at least 1 delivered/completed order yesterday
  const ordersYesterday = await Order.aggregate([
    {
      $match: {
        deleted: { $ne: true },
        status: { $in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED] },
        createdAt: { $gte: yesterdayStartUTC, $lte: yesterdayEndUTC },
      },
    },
    {
      $group: {
        _id: { $ifNull: ["$user", "$customer"] },
      },
    },
  ]);

  const activeCustomerIdsYesterday = new Set<string>();
  for (const o of ordersYesterday) {
    if (o._id) {
      activeCustomerIdsYesterday.add(o._id.toString());
    }
  }

  // 3. Update Progress records for Weekly & Monthly
  const allProgress = await CustomerLeaderboardProgress.find({
    period: { $in: [LeaderboardPeriod.WEEKLY, LeaderboardPeriod.MONTHLY] },
  });

  for (const prog of allProgress) {
    const custIdStr = prog.customerId.toString();

    // Check Order Streak: Did customer order yesterday?
    if (activeCustomerIdsYesterday.has(custIdStr)) {
      // Ordered yesterday -> Increment order streak
      prog.consecutiveOrderDays = (prog.consecutiveOrderDays || 0) + 1;
      prog.lastOrderDateIST = yesterdayDateKey;
    } else {
      // Did not order yesterday -> Reset streak
      prog.consecutiveOrderDays = 0;
    }

    // Rank Maintenance: Rank was maintained if it stayed <= 3 or stayed at its current position
    // Since syncLeaderboardProgress updated currentRank, increment maintain days if rank > 0
    if (prog.currentRank > 0) {
      prog.consecutiveDaysAtCurrentRank = (prog.consecutiveDaysAtCurrentRank || 0) + 1;
    }

    await prog.save();
  }

  // 4. Trigger Automatic Reward Dispatching for eligible winners
  const weeklyResult = await LeaderboardRewardDispatcher.evaluateAndDispatchPeriodRewards(
    LeaderboardPeriod.WEEKLY
  );
  const monthlyResult = await LeaderboardRewardDispatcher.evaluateAndDispatchPeriodRewards(
    LeaderboardPeriod.MONTHLY
  );

  console.log(
    `[CRON] Daily Leaderboard completed. Weekly: ${weeklyResult.rewardedCount} rewarded (${weeklyResult.pendingTieCount} ties pending). Monthly: ${monthlyResult.rewardedCount} rewarded.`
  );
}

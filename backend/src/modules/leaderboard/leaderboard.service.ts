import mongoose from "mongoose";
import { LeaderboardConfig, ILeaderboardConfig } from "../../models/leaderboardConfig.model";
import {
  CustomerLeaderboardProgress,
  ICustomerLeaderboardProgress,
} from "../../models/customerLeaderboardProgress.model";
import { Order } from "../../models/order.model";
import User, { IUser } from "../../models/user.model";
import { Customer } from "../../models/customer.model";
import { CoinTransaction } from "../../models/coinTransaction.model";
import {
  LeaderboardPeriod,
  LeaderboardRankingMetric,
  NameDisplayFormat,
  OrderStatus,
} from "../../common/enum";

export interface DateWindowIST {
  start: Date;
  end: Date;
  periodKey: string;
}

export interface HydratedLeaderboardEntry {
  customerId: string;
  customerName: string;
  customerPhone?: string;
  rank: number;
  totalSpending: number;
  completedOrdersCount: number;
  totalCoinsEarned: number;
  consecutiveDaysAtCurrentRank: number;
  consecutiveOrderDays: number;
  gapToFirst: number;
  isTied: boolean;
  tiedCount?: number;
  isCurrentUser?: boolean;
}

export class LeaderboardService {
  /**
   * Helper: Get current IST time Date object
   */
  public static getNowIST(): Date {
    const now = new Date();
    // Offset for Asia/Kolkata is +5 hours 30 mins
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utcTime + 5.5 * 3600000);
  }

  /**
   * Helper: Calculate ISO Week Number for periodKey e.g. "2026-W41"
   */
  public static getISOWeekKey(d: Date): string {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  }

  /**
   * Calculates IST start/end boundary and periodKey for weekly, monthly, and all_time
   */
  public static getDateWindowIST(period: LeaderboardPeriod): DateWindowIST {
    const now = new Date();
    const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const istDate = new Date(istString);
    const year = istDate.getFullYear();
    const month = istDate.getMonth(); // 0-indexed
    const day = istDate.getDate();

    if (period === LeaderboardPeriod.WEEKLY) {
      const dayOfWeek = istDate.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const mondayDate = day - diffToMonday;

      const startIST = new Date(year, month, mondayDate, 0, 0, 0, 0);
      const endIST = new Date(year, month, day, 23, 59, 59, 999);

      const startUTC = new Date(startIST.getTime() - 5.5 * 3600000);
      const endUTC = new Date(endIST.getTime() - 5.5 * 3600000);

      const periodKey = this.getISOWeekKey(istDate);
      return { start: startUTC, end: endUTC, periodKey };
    }

    if (period === LeaderboardPeriod.MONTHLY) {
      const startIST = new Date(year, month, 1, 0, 0, 0, 0);
      const endIST = new Date(year, month, day, 23, 59, 59, 999);

      const startUTC = new Date(startIST.getTime() - 5.5 * 3600000);
      const endUTC = new Date(endIST.getTime() - 5.5 * 3600000);

      const periodKey = `${year}-${String(month + 1).padStart(2, "0")}`;
      return { start: startUTC, end: endUTC, periodKey };
    }

    // ALL_TIME
    return {
      start: new Date(0),
      end: new Date(),
      periodKey: "all_time",
    };
  }

  /**
   * Format customer name based on config:
   * - INITIALS: "Rahul Sharma" -> "R. S.", "Amit Kumar" -> "A. K.", "Priya" -> "P."
   * - FIRST_NAME_INITIAL: "Rahul Sharma" -> "Rahul S."
   */
  public static formatCustomerName(name: string, format: NameDisplayFormat = NameDisplayFormat.INITIALS): string {
    if (!name || !name.trim()) return "V. F.";
    const parts = name.trim().split(/\s+/);

    if (format === NameDisplayFormat.FIRST_NAME_INITIAL) {
      if (parts.length === 1) return parts[0];
      const first = parts[0];
      const lastInitial = parts[parts.length - 1][0]?.toUpperCase() || "";
      return `${first} ${lastInitial}.`;
    }

    // Default: INITIALS (e.g. R. P. / P. S. from Infographic)
    if (parts.length === 1) {
      return `${parts[0][0]?.toUpperCase() || "C"}.`;
    }
    const firstInitial = parts[0][0]?.toUpperCase() || "";
    const lastInitial = parts[parts.length - 1][0]?.toUpperCase() || "";
    return `${firstInitial}. ${lastInitial}.`;
  }

  /**
   * Retrieves or initializes the singleton leaderboard configuration
   */
  public static async getConfig(): Promise<ILeaderboardConfig> {
    let config = await LeaderboardConfig.findOne();
    if (!config) {
      config = await LeaderboardConfig.create({});
    }
    return config;
  }

  /**
   * Core Aggregation Pipeline:
   * Computes ranking metrics directly from delivered orders:
   * 1. Minimum eligible order amount filter (default >= ₹80). Orders below this are excluded.
   * 2. Exclude coins used (spending evaluated on eligible food items after discounts and before coins).
   * 3. Exclude delivery charges (subtotal minus discounts, excluding delivery fee).
   * 4. Groups by User ID, sorts, calculates dense ranks, and computes "Gap to 1st".
   */
  public static async computeMetricsForPeriod(period: LeaderboardPeriod) {
    const { start, end, periodKey } = this.getDateWindowIST(period);
    const config = await this.getConfig();

    const minAmount = typeof config.minEligibleOrderAmount === "number" ? config.minEligibleOrderAmount : 80;
    const excludeCoins = config.excludeCoinsUsed !== false;
    const excludeDelivery = config.excludeDeliveryCharges !== false;

    const orderMatch: any = {
      deleted: { $ne: true },
      status: { $in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED] },
    };

    if (period !== LeaderboardPeriod.ALL_TIME) {
      orderMatch.createdAt = { $gte: start, $lte: end };
    }

    // Match raw delivered orders in the period
    const rawOrders = await Order.find(orderMatch).select(
      "user customer guest payment totalAmount items createdAt"
    );

    // Group eligible spending per User
    const metricsMap = new Map<
      string,
      {
        userId: string;
        totalSpending: number;
        completedOrdersCount: number;
        lastOrderDate: Date;
        coinsEarned: number;
      }
    >();

    for (const order of rawOrders) {
      const p = order.payment || ({} as any);

      // Compute Eligible Spending per Infographic Rules:
      // Subtotal (food cost) minus food discounts.
      // Do NOT include delivery charges if excludeDelivery is true.
      // Do NOT deduct coinsUsed if excludeCoins is true (spending counts before coins, but excluding coins value).
      let eligibleSpend = 0;
      if (typeof p.subTotal === "number" && p.subTotal > 0) {
        const discount = typeof p.discount === "number" ? p.discount : 0;
        eligibleSpend = Math.max(0, p.subTotal - discount);
      } else {
        // Fallback for orders without separate subTotal: take totalAmount or payment.amount minus deliveryCharge
        const total =
          typeof p.totalAmount === "number"
            ? p.totalAmount
            : typeof (order as any).totalAmount === "number"
            ? (order as any).totalAmount
            : typeof (p as any).amount === "number"
            ? (p as any).amount
            : 0;
        const delivery = excludeDelivery
          ? p.deliveryCharge || (order as any).deliveryCharge || 0
          : 0;
        eligibleSpend = Math.max(0, total - delivery);
      }

      // 1. Min Order Amount Eligibility Check (e.g. >= ₹80)
      if (eligibleSpend < minAmount) {
        // Excluded: Order does not meet minimum qualifying spend threshold
        continue;
      }

      // Resolve User ID
      let rawCustId = order.user || order.customer;
      let resolvedUserId: string = "";

      if (rawCustId) {
        const rawIdStr = rawCustId.toString();
        const userExists = await User.exists({ _id: rawCustId });
        if (userExists) {
          resolvedUserId = rawIdStr;
        } else {
          const cust = await Customer.findById(rawCustId).select("user");
          if (cust?.user) {
            resolvedUserId = cust.user.toString();
          }
        }
      }

      // If still not resolved, try resolving by guest phone or customer phone
      if (!resolvedUserId && (order as any).guest?.phone) {
        const phone = (order as any).guest.phone.trim();
        const matchingUser = await User.findOne({ phone }).select("_id");
        if (matchingUser) {
          resolvedUserId = matchingUser._id.toString();
        }
      }

      if (!resolvedUserId) continue;

      if (metricsMap.has(resolvedUserId)) {
        const existing = metricsMap.get(resolvedUserId)!;
        existing.totalSpending += eligibleSpend;
        existing.completedOrdersCount += 1;
        if (order.createdAt > existing.lastOrderDate) {
          existing.lastOrderDate = order.createdAt;
        }
      } else {
        metricsMap.set(resolvedUserId, {
          userId: resolvedUserId,
          totalSpending: eligibleSpend,
          completedOrdersCount: 1,
          lastOrderDate: order.createdAt,
          coinsEarned: 0,
        });
      }
    }

    // Round total spending to 2 decimals
    for (const entry of metricsMap.values()) {
      entry.totalSpending = Math.round(entry.totalSpending * 100) / 100;
    }

    // Coin earnings aggregation for this period window
    const coinMatch: any = {
      direction: "CREDIT",
    };
    if (period !== LeaderboardPeriod.ALL_TIME) {
      coinMatch.createdAt = { $gte: start, $lte: end };
    }
    const coinAgg = await CoinTransaction.aggregate([
      { $match: coinMatch },
      {
        $group: {
          _id: "$user",
          totalCoins: { $sum: "$amount" },
        },
      },
    ]);

    for (const c of coinAgg) {
      if (!c._id) continue;
      const uId = c._id.toString();
      if (metricsMap.has(uId)) {
        metricsMap.get(uId)!.coinsEarned = c.totalCoins;
      }
    }

    const metricList = Array.from(metricsMap.values());

    // Sort according to ranking metric
    const isSpending = config.rankingMetric === LeaderboardRankingMetric.TOTAL_SPENDING;
    metricList.sort((a, b) => {
      const primaryDiff = isSpending
        ? b.totalSpending - a.totalSpending
        : b.completedOrdersCount - a.completedOrdersCount;

      if (primaryDiff !== 0) return primaryDiff;

      const secondaryDiff = isSpending
        ? b.completedOrdersCount - a.completedOrdersCount
        : b.totalSpending - a.totalSpending;

      if (secondaryDiff !== 0) return secondaryDiff;

      return b.coinsEarned - a.coinsEarned;
    });

    // Detect Ties and Assign Standard Dense/Identical Ranks
    let currentRank = 1;
    const rankedList: Array<{
      userId: string;
      totalSpending: number;
      completedOrdersCount: number;
      coinsEarned: number;
      rank: number;
      gapToFirst: number;
      isTied: boolean;
      tiedWithUserIds: string[];
      lastOrderDate: Date;
    }> = [];

    const rank1Spending = metricList.length > 0 ? metricList[0].totalSpending : 0;

    for (let i = 0; i < metricList.length; i++) {
      const current = metricList[i];
      if (i > 0) {
        const prev = metricList[i - 1];
        const isIdentical =
          current.totalSpending === prev.totalSpending &&
          current.completedOrdersCount === prev.completedOrdersCount &&
          current.coinsEarned === prev.coinsEarned;

        if (!isIdentical) {
          currentRank = i + 1;
        }
      }

      // Mathematical Gap to 1st Position
      // If customer is Rank 1, gap is 0; otherwise: max(0, Rank 1 Spend - Customer Spend)
      const gapToFirst = currentRank === 1 ? 0 : Math.max(0, Math.round((rank1Spending - current.totalSpending) * 100) / 100);

      rankedList.push({
        userId: current.userId,
        totalSpending: current.totalSpending,
        completedOrdersCount: current.completedOrdersCount,
        coinsEarned: current.coinsEarned,
        rank: currentRank,
        gapToFirst,
        isTied: false,
        tiedWithUserIds: [],
        lastOrderDate: current.lastOrderDate,
      });
    }

    // Flag ties and collect tied rival IDs
    for (const item of rankedList) {
      const tiedRivals = rankedList
        .filter((r) => r.rank === item.rank && r.userId !== item.userId)
        .map((r) => r.userId);

      if (tiedRivals.length > 0) {
        item.isTied = true;
        item.tiedWithUserIds = tiedRivals;
      }
    }

    return { rankedList, periodKey, config };
  }

  /**
   * Syncs and persists calculated rankings and gapToFirst into `CustomerLeaderboardProgress`
   */
  public static async syncLeaderboardProgress(period: LeaderboardPeriod) {
    const { rankedList, periodKey } = await this.computeMetricsForPeriod(period);

    for (const item of rankedList) {
      if (!mongoose.Types.ObjectId.isValid(item.userId)) continue;

      const userObjectId = new mongoose.Types.ObjectId(item.userId);
      const existing = await CustomerLeaderboardProgress.findOne({
        customerId: userObjectId,
        period,
        periodKey,
      });

      let consecutiveDaysAtRank = 1;
      if (existing) {
        if (existing.currentRank === item.rank) {
          consecutiveDaysAtRank = existing.consecutiveDaysAtCurrentRank || 1;
        }
      }

      await CustomerLeaderboardProgress.findOneAndUpdate(
        {
          customerId: userObjectId,
          period,
          periodKey,
        },
        {
          $set: {
            totalSpending: item.totalSpending,
            completedOrdersCount: item.completedOrdersCount,
            totalCoinsEarned: item.coinsEarned,
            currentRank: item.rank,
            gapToFirst: item.gapToFirst,
            isTied: item.isTied,
            tiedWithCustomerIds: item.tiedWithUserIds.map(
              (id) => new mongoose.Types.ObjectId(id)
            ),
          },
          $setOnInsert: {
            consecutiveDaysAtCurrentRank: consecutiveDaysAtRank,
            consecutiveOrderDays: 0,
          },
        },
        { upsert: true, new: true }
      );
    }
  }

  /**
   * Personalized Perspective Resolver:
   * Returns configured Top N (default Top 5), short initials (R. P., P. S.),
   * and customer's personalized progress with exact `gapToFirst`.
   */
  public static async getCustomerLeaderboardView(
    period: LeaderboardPeriod = LeaderboardPeriod.MONTHLY,
    currentUserId?: string,
    requestedLimit?: number
  ) {
    const { rankedList, periodKey, config } = await this.computeMetricsForPeriod(period);
    const limit = requestedLimit || config.publicTopCount || 5;

    // Fetch existing progress documents for streak & position maintain metrics
    const userIds = rankedList.map((r) => new mongoose.Types.ObjectId(r.userId));
    const [progressDocs, userDocs] = await Promise.all([
      CustomerLeaderboardProgress.find({
        customerId: { $in: userIds },
        period,
        periodKey,
      }),
      User.find({ _id: { $in: userIds } }).select("name phone avatar"),
    ]);

    const progressMap = new Map<string, ICustomerLeaderboardProgress>();
    progressDocs.forEach((p) => progressMap.set(p.customerId.toString(), p));

    const userMap = new Map<string, IUser>();
    userDocs.forEach((u) => userMap.set(u._id.toString(), u));

    // Personalized Perspective Filtering:
    // If viewer is Customer A and Customer A is tied at rank R:
    // Customer A sees themselves at rank R, tied rival is excluded from rank R display.
    let displayList = [...rankedList];
    const isViewerTied =
      currentUserId &&
      rankedList.some(
        (r) => r.userId === currentUserId && r.isTied && r.rank <= 3
      );

    if (isViewerTied) {
      const viewerRank = rankedList.find((r) => r.userId === currentUserId)?.rank;
      displayList = displayList.filter((item) => {
        if (item.rank === viewerRank) {
          return item.userId === currentUserId;
        }
        return true;
      });
    } else {
      const seenRanks = new Set<number>();
      displayList = displayList.filter((item) => {
        if (seenRanks.has(item.rank) && item.rank <= 3) {
          return false;
        }
        seenRanks.add(item.rank);
        return true;
      });
    }

    // Hydrate profile data with short initial formatting per config
    const nameFormat = config.nameDisplayFormat || NameDisplayFormat.INITIALS;

    const hydratedTopList: HydratedLeaderboardEntry[] = displayList
      .slice(0, limit)
      .map((item) => {
        const u = userMap.get(item.userId);
        const prog = progressMap.get(item.userId);
        const isSelf = currentUserId === item.userId;

        const rawName = u?.name || "Homely Foodie";
        const displayName = isSelf ? rawName : this.formatCustomerName(rawName, nameFormat);

        return {
          customerId: item.userId,
          customerName: displayName,
          rank: item.rank,
          totalSpending: item.totalSpending,
          completedOrdersCount: item.completedOrdersCount,
          totalCoinsEarned: item.coinsEarned,
          consecutiveDaysAtCurrentRank: prog?.consecutiveDaysAtCurrentRank || 1,
          consecutiveOrderDays: prog?.consecutiveOrderDays || 0,
          gapToFirst: item.gapToFirst,
          isTied: item.isTied,
          tiedCount: item.tiedWithUserIds.length + 1,
          isCurrentUser: isSelf,
        };
      });

    // Compute viewer's personalized stats
    let userProgress: HydratedLeaderboardEntry | null = null;
    if (currentUserId) {
      const userItem = rankedList.find((r) => r.userId === currentUserId);
      const userDoc = userMap.get(currentUserId);
      const userProg = progressMap.get(currentUserId);

      if (userItem) {
        userProgress = {
          customerId: currentUserId,
          customerName: userDoc?.name || "You",
          rank: userItem.rank,
          totalSpending: userItem.totalSpending,
          completedOrdersCount: userItem.completedOrdersCount,
          totalCoinsEarned: userItem.coinsEarned,
          consecutiveDaysAtCurrentRank: userProg?.consecutiveDaysAtCurrentRank || 1,
          consecutiveOrderDays: userProg?.consecutiveOrderDays || 0,
          gapToFirst: userItem.gapToFirst,
          isTied: userItem.isTied,
          tiedCount: userItem.tiedWithUserIds.length + 1,
          isCurrentUser: true,
        };
      }
    }

    return {
      period,
      periodKey,
      periodMode: config.periodMode || "MONTHLY_ONLY",
      publicTopCount: limit,
      topLeaderboard: hydratedTopList,
      userProgress,
    };
  }

  /**
   * Admin Leaderboard View (Section 5 of Infographic):
   * Full, unmasked customer details, real names, phone numbers,
   * completed orders, eligible spending, coins earned, streaks, maintain days, and gapToFirst.
   */
  public static async getAdminLeaderboardView(
    period: LeaderboardPeriod = LeaderboardPeriod.MONTHLY
  ) {
    const { rankedList, periodKey, config } = await this.computeMetricsForPeriod(period);

    const userIds = rankedList.map((r) => new mongoose.Types.ObjectId(r.userId));
    const [progressDocs, userDocs] = await Promise.all([
      CustomerLeaderboardProgress.find({
        customerId: { $in: userIds },
        period,
        periodKey,
      }),
      User.find({ _id: { $in: userIds } }).select("name phone email avatar"),
    ]);

    const progressMap = new Map<string, ICustomerLeaderboardProgress>();
    progressDocs.forEach((p) => progressMap.set(p.customerId.toString(), p));

    const userMap = new Map<string, IUser>();
    userDocs.forEach((u) => userMap.set(u._id.toString(), u));

    const adminList = rankedList.map((item) => {
      const u = userMap.get(item.userId);
      const prog = progressMap.get(item.userId);

      return {
        customerId: item.userId,
        customerName: u?.name || "Unnamed Customer",
        customerPhone: u?.phone || "N/A",
        customerEmail: u?.email || "",
        rank: item.rank,
        isTied: item.isTied,
        tiedWithUserIds: item.tiedWithUserIds,
        totalSpending: item.totalSpending,
        completedOrdersCount: item.completedOrdersCount,
        totalCoinsEarned: item.coinsEarned,
        consecutiveDaysAtCurrentRank: prog?.consecutiveDaysAtCurrentRank || 1,
        consecutiveOrderDays: prog?.consecutiveOrderDays || 0,
        gapToFirst: item.gapToFirst,
        rewardStatus: prog?.rewardStatus || "NONE",
      };
    });

    return {
      period,
      periodKey,
      totalParticipants: adminList.length,
      config: {
        minEligibleOrderAmount: config.minEligibleOrderAmount || 80,
        excludeCoinsUsed: config.excludeCoinsUsed !== false,
        excludeDeliveryCharges: config.excludeDeliveryCharges !== false,
        publicTopCount: config.publicTopCount || 5,
      },
      customers: adminList,
    };
  }
}

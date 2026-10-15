export enum CookiesNames {
  USER_ACCESS = "user_access",
  USER_REFRESH = "user_refresh",
  ADMIN_ACCESS = "admin_access",
  ADMIN_REFRESH = "admin_refresh",
}

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  BLOCKED = "blocked",
}

export enum CategoryStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export enum MenuItemStatus {
  AVAILABLE = "available",
  UNAVAILABLE = "unavailable",
}

export enum VariantStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export enum OrderStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  PREPARING = "preparing",
  READY = "ready",
  OUT_FOR_DELIVERY = "out_for_delivery",
  DELIVERED = "delivered",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum OrderType {
  DINE_IN = "dine-in",
  DELIVERY = "delivery",
  PICKUP = "pickup",
}

export enum PaymentStatus {
  PENDING = "pending",
  CREATED = "created",
  ATTEMPTED = "attempted",
  PAID = "paid",
  UNPAID = "unpaid",
  FAILED = "failed",
  EXPIRED = "expired",
  REFUNDED = "refunded",
  PARTIALLY_REFUNDED = "partially_refunded",
}

export enum PaymentMethod {
  CASH = "cash",
  COD = "cod",
  ONLINE = "online",
  RAZORPAY = "razorpay",
  UPI = "upi",
  CARD = "card",
}

export enum PaymentGateway {
  RAZORPAY = "razorpay",
}

export enum OfferType {
  BOGO = "BOGO",
  PERCENTAGE = "PERCENTAGE",
  FLAT = "FLAT",
}

export enum OfferStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  INACTIVE = "inactive",
  UPCOMING = "upcoming",
}

export enum OrderFor {
  REGISTERED_USER = "registered_user",
  GUEST = "guest",
}

export enum CartStatus {
  ACTIVE = "active",
  COMPLETED = "completed"
}

export enum CoinTransactionType {
  WELCOME_BONUS = "WELCOME_BONUS",
  ORDER_REWARD_FIXED = "ORDER_REWARD_FIXED",
  ORDER_REWARD_PERCENT = "ORDER_REWARD_PERCENT",
  ADMIN_GRANT = "ADMIN_GRANT",
  LEADERBOARD_REWARD = "LEADERBOARD_REWARD",
  EXPIRED = "EXPIRED",
  SPENT = "SPENT",
}

export enum CoinTransactionDirection {
  CREDIT = "CREDIT",
  DEBIT = "DEBIT",
}

export enum LeaderboardRewardType {
  DISCOUNT_VOUCHER = "DISCOUNT_VOUCHER",
  COINS = "COINS",
  FREE_ITEM = "FREE_ITEM",
}

export enum LeaderboardRankingMetric {
  TOTAL_SPENDING = "TOTAL_SPENDING",
  ORDER_COUNT = "ORDER_COUNT",
}

export enum LeaderboardPeriod {
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  ALL_TIME = "all_time",
}

export enum LeaderboardPeriodMode {
  MONTHLY_ONLY = "MONTHLY_ONLY",
  MULTI_PERIOD = "MULTI_PERIOD",
}

export enum NameDisplayFormat {
  INITIALS = "INITIALS",
  FIRST_NAME_INITIAL = "FIRST_NAME_INITIAL",
}

export enum LeaderboardRewardStatus {
  NONE = "NONE",
  ELIGIBLE = "ELIGIBLE",
  PENDING_ADMIN_DECISION = "PENDING_ADMIN_DECISION",
  CLAIMED = "CLAIMED",
}




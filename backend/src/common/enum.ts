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
  PAID = "paid",
  UNPAID = "unpaid",
  FAILED = "failed",
}

export enum PaymentMethod {
  CASH = "cash",
  ONLINE = "online",
  UPI = "upi",
  CARD = "card",
}

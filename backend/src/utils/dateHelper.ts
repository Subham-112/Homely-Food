import ApiError from "./ApiError";

export type PeriodType = "today" | "yesterday" | "weekly" | "monthly" | "yearly" | "custom";

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Returns startDate and endDate range for a specific single date string.
 * Supports "today", "yesterday", or "YYYY-MM-DD" / valid ISO date.
 */
export const getDateRangeForSpecificDate = (dateParam: string): DateRange => {
  const clean = dateParam.trim().toLowerCase();
  const now = new Date();

  if (clean === "today") {
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  }

  if (clean === "yesterday") {
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() - 1);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  }

  // Handle YYYY-MM-DD format (Local start & end of day)
  const parts = clean.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      const startDate = new Date(year, month, day, 0, 0, 0, 0);
      const endDate = new Date(year, month, day, 23, 59, 59, 999);
      return { startDate, endDate };
    }
  }

  const parsed = new Date(dateParam);
  if (isNaN(parsed.getTime())) {
    throw new ApiError(400, "Invalid date format provided.");
  }
  const startDate = new Date(parsed);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(parsed);
  endDate.setHours(23, 59, 59, 999);
  return { startDate, endDate };
};

/**
 * Returns startDate and endDate range for a given period.
 * 1 DAY is considered from 12:00:00.000 AM to 11:59:59.999 PM.
 */
export const getDateRangeByPeriod = (
  period?: PeriodType | string,
  customStartDate?: string | Date,
  customEndDate?: string | Date
): DateRange | undefined => {
  if (!period) return undefined;

  const normalizedPeriod = period.toLowerCase().trim() as PeriodType;

  const now = new Date();

  if (normalizedPeriod === "today") {
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  if (normalizedPeriod === "yesterday") {
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() - 1);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  if (normalizedPeriod === "weekly") {
    const startDate = new Date(now);
    // Go to Monday of current week
    const day = startDate.getDay(); // 0 is Sunday
    const diffToMonday = startDate.getDate() - day + (day === 0 ? -6 : 1);
    startDate.setDate(diffToMonday);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  if (normalizedPeriod === "monthly") {
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  if (normalizedPeriod === "yearly") {
    const startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  if (normalizedPeriod === "custom") {
    if (!customStartDate || !customEndDate) {
      throw new ApiError(400, "startDate and endDate are required when period is custom.");
    }

    const startDate = new Date(customStartDate);
    const endDate = new Date(customEndDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new ApiError(400, "Invalid startDate or endDate provided.");
    }

    // Ensure start of day for startDate and end of day for endDate
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    if (startDate > endDate) {
      throw new ApiError(400, "startDate cannot be after endDate.");
    }

    return { startDate, endDate };
  }

  throw new ApiError(400, "Invalid period specified. Allowed values: today, yesterday, weekly, monthly, yearly, custom.");
};

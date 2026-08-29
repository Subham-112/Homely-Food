/**
 * Currency and Integer Monetary Helpers
 * All monetary amounts are handled in the smallest currency unit (Paise for INR, 1 INR = 100 Paise)
 * to avoid floating-point arithmetic errors.
 */

/**
 * Converts standard currency units (e.g. Rupees) to smallest currency units (Paise).
 * Handles numbers and string inputs safely.
 */
export const toPaise = (amountInRupees: number | string | undefined | null): number => {
  if (amountInRupees === undefined || amountInRupees === null || isNaN(Number(amountInRupees))) {
    return 0;
  }
  const numericVal = typeof amountInRupees === "string" ? parseFloat(amountInRupees) : amountInRupees;
  // Use Math.round to mitigate JavaScript floating point imprecision (e.g. 19.99 * 100 = 1998.9999999999998)
  return Math.round(numericVal * 100);
};

/**
 * Converts smallest currency units (Paise) to standard currency units (Rupees).
 */
export const toRupees = (amountInPaise: number | undefined | null): number => {
  if (amountInPaise === undefined || amountInPaise === null || isNaN(amountInPaise)) {
    return 0;
  }
  return Number((amountInPaise / 100).toFixed(2));
};

/**
 * Safe integer addition for monetary amounts in paise.
 */
export const safeAddPaise = (...amounts: number[]): number => {
  return amounts.reduce((acc, curr) => acc + Math.round(curr || 0), 0);
};

/**
 * Safe integer subtraction for monetary amounts in paise (never below 0 unless allowNegative is true).
 */
export const safeSubtractPaise = (base: number, subtract: number, allowNegative = false): number => {
  const result = Math.round(base || 0) - Math.round(subtract || 0);
  return allowNegative ? result : Math.max(0, result);
};

/**
 * Formats paise to a standard currency string (e.g. 1999 paise -> "19.99").
 */
export const formatPaiseToRupees = (amountInPaise: number): string => {
  return (amountInPaise / 100).toFixed(2);
};

/**
 * Converts a UTC ISO string (or any valid date string) to Indian Standard Time (IST) string.
 */
export const formatUTCToIST = (utcString?: string): string => {
  if (!utcString) return "";
  try {
    const date = new Date(utcString);
    // Explicitly format to India Time Zone (GMT+5:30)
    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (err) {
    return utcString;
  }
};

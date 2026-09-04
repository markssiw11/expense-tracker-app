import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { formatCurrency as formatCurrencyFromStore } from "../services/currencyStore";

/**
 * Format an amount using the app's active currency (see currencyStore).
 * NOTE: This is a plain function and does not re-render React components when
 * the currency changes. In components, prefer the useCurrencyFormat() hook.
 * @param amount - Amount to format
 * @returns Formatted currency string (e.g., "1.000.000 ₫")
 */
export const formatCurrency = (amount: number): string => {
  return formatCurrencyFromStore(amount);
};

/**
 * Format currency using Intl.NumberFormat (alternative format with spacing)
 * @param amount - Amount to format
 * @returns Formatted currency string (e.g., "1.000.000 ₫")
 */
export const formatCurrencyIntl = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

/**
 * Format date to Vietnamese display format
 * @param dateString - ISO date string
 * @param formatString - Format pattern (default: 'dd/MM/yyyy')
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string,
  formatString: string = "dd/MM/yyyy",
): string => {
  try {
    const date = parseISO(dateString);
    return format(date, formatString, { locale: vi });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

/**
 * Format date with Vietnamese day name
 * @param dateString - ISO date string
 * @returns Formatted date string with day name (e.g., "Thứ Hai, 15/01/2024")
 */
export const formatDateWithDay = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, "EEEE, dd/MM/yyyy", { locale: vi });
  } catch (error) {
    console.error("Error formatting date with day:", error);
    return dateString;
  }
};

/**
 * Format date for display in Vietnamese locale
 * @param date - Date object
 * @returns Formatted date string (e.g., "15/01/2024")
 */
export const formatDateObject = (date: Date): string => {
  return format(date, "dd/MM/yyyy", { locale: vi });
};

/**
 * Format date with month name in Vietnamese
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "15 Tháng 1, 2024")
 */
export const formatDateWithMonthName = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, "dd MMMM, yyyy", { locale: vi });
  } catch (error) {
    console.error("Error formatting date with month name:", error);
    return dateString;
  }
};

/**
 * Format month and year in Vietnamese
 * @param dateString - ISO date string or YYYY-MM format
 * @returns Formatted month string (e.g., "Tháng 1, 2024")
 */
export const formatMonthYear = (dateString: string): string => {
  try {
    let date: Date;
    if (dateString.includes("-") && dateString.length === 7) {
      // YYYY-MM format
      const [year, month] = dateString.split("-").map(Number);
      date = new Date(year, month - 1, 1);
    } else {
      date = parseISO(dateString);
    }
    return format(date, "MMMM yyyy", { locale: vi });
  } catch (error) {
    console.error("Error formatting month year:", error);
    return dateString;
  }
};

/**
 * Get week start day for Vietnamese locale (Monday)
 * @returns Week start day (1 = Monday)
 */
export const getWeekStartDay = (): 0 | 1 | 2 | 3 | 4 | 5 | 6 => {
  return 1; // Monday for Vietnamese locale
};

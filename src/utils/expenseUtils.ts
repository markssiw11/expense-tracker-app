import {
  format,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
} from "date-fns";
import {
  Expense,
  ExpenseCategory,
  CategoryBreakdown,
  MonthlySummary,
} from "../types";

/**
 * Filter expenses by month
 * @param expenses - Array of expenses
 * @param month - Month in format YYYY-MM
 * @returns Filtered expenses for the specified month
 */
export const filterExpensesByMonth = (
  expenses: Expense[],
  month: string
): Expense[] => {
  try {
    const [year, monthNum] = month.split("-").map(Number);
    const date = new Date(year, monthNum - 1, 1);
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    return expenses.filter((expense) => {
      const expenseDate = parseISO(expense.date);
      return isWithinInterval(expenseDate, { start, end });
    });
  } catch (error) {
    console.error("Error filtering expenses by month:", error);
    return [];
  }
};

/**
 * Calculate total amount for expenses
 * @param expenses - Array of expenses
 * @returns Total amount
 */
export const calculateMonthlyTotal = (expenses: Expense[]): number => {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
};

/**
 * Group expenses by category
 * @param expenses - Array of expenses
 * @returns Object with expenses grouped by category
 */
export const groupExpensesByCategory = (
  expenses: Expense[]
): Record<ExpenseCategory, Expense[]> => {
  const grouped = {} as Record<ExpenseCategory, Expense[]>;

  expenses.forEach((expense) => {
    if (!grouped[expense.category]) {
      grouped[expense.category] = [];
    }
    grouped[expense.category].push(expense);
  });

  return grouped;
};

/**
 * Calculate category breakdown with percentages
 * @param expenses - Array of expenses
 * @returns Array of category breakdowns sorted by amount descending
 */
export const calculateCategoryBreakdown = (
  expenses: Expense[]
): CategoryBreakdown[] => {
  const total = calculateMonthlyTotal(expenses);
  const grouped = groupExpensesByCategory(expenses);

  const breakdown: CategoryBreakdown[] = Object.entries(grouped).map(
    ([category, categoryExpenses]) => {
      const amount = calculateMonthlyTotal(categoryExpenses);
      return {
        category: category as ExpenseCategory,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        count: categoryExpenses.length,
      };
    }
  );

  // Sort by amount descending
  return breakdown.sort((a, b) => b.amount - a.amount);
};

/**
 * Generate monthly summary
 * @param expenses - Array of expenses
 * @param month - Month in format YYYY-MM
 * @returns Monthly summary object
 */
export const generateMonthlySummary = (
  expenses: Expense[],
  month: string
): MonthlySummary => {
  const monthlyExpenses = filterExpensesByMonth(expenses, month);
  const totalAmount = calculateMonthlyTotal(monthlyExpenses);
  const categoryBreakdown = calculateCategoryBreakdown(monthlyExpenses);

  return {
    month,
    totalAmount,
    expenseCount: monthlyExpenses.length,
    categoryBreakdown,
  };
};

/**
 * Format currency in Vietnamese Dong
 * @param amount - Amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

/**
 * Format date to display format
 * @param dateString - ISO date string
 * @param formatString - Format pattern (default: 'dd/MM/yyyy')
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string,
  formatString: string = "dd/MM/yyyy"
): string => {
  try {
    const date = parseISO(dateString);
    return format(date, formatString);
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

/**
 * Get current month in YYYY-MM format
 * @returns Current month string
 */
export const getCurrentMonth = (): string => {
  return format(new Date(), "yyyy-MM");
};

/**
 * Get previous month in YYYY-MM format
 * @param month - Current month in YYYY-MM format
 * @returns Previous month string
 */
export const getPreviousMonth = (month: string): string => {
  const [year, monthNum] = month.split("-").map(Number);
  const date = new Date(year, monthNum - 1, 1);
  date.setMonth(date.getMonth() - 1);
  return format(date, "yyyy-MM");
};

/**
 * Get next month in YYYY-MM format
 * @param month - Current month in YYYY-MM format
 * @returns Next month string
 */
export const getNextMonth = (month: string): string => {
  const [year, monthNum] = month.split("-").map(Number);
  const date = new Date(year, monthNum - 1, 1);
  date.setMonth(date.getMonth() + 1);
  return format(date, "yyyy-MM");
};

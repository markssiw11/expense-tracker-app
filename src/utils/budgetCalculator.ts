import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
} from "date-fns";
import { Expense } from "../types/expense.types";
import {
  SpendingLimit,
  BudgetStatus,
  BudgetPeriodType,
} from "../types/spendingLimit.types";
import { getWeekStartDay } from "./formatUtils";

/**
 * Validates that an amount is positive
 * @param amount - The amount to validate
 * @returns true if amount is positive and finite, false otherwise
 */
export function isPositiveAmount(amount: number): boolean {
  return amount > 0 && isFinite(amount);
}

/**
 * Gets the date range for a given budget period
 * @param periodType - The type of budget period (weekly or monthly)
 * @param referenceDate - The reference date (defaults to current date)
 * @returns Object with start and end dates
 */
export function getPeriodDateRange(
  periodType: BudgetPeriodType,
  referenceDate: Date = new Date()
): { start: Date; end: Date } {
  if (periodType === BudgetPeriodType.WEEKLY) {
    // Week starts on Monday for Vietnamese locale
    const weekStartDay = getWeekStartDay();
    return {
      start: startOfWeek(referenceDate, { weekStartsOn: weekStartDay }),
      end: endOfWeek(referenceDate, { weekStartsOn: weekStartDay }),
    };
  } else {
    // Monthly period
    return {
      start: startOfMonth(referenceDate),
      end: endOfMonth(referenceDate),
    };
  }
}

/**
 * Filters expenses to only those within a specific period
 * @param expenses - Array of expenses to filter
 * @param periodType - The type of budget period
 * @param referenceDate - The reference date (defaults to current date)
 * @returns Array of expenses within the period
 */
export function getExpensesInPeriod(
  expenses: Expense[],
  periodType: BudgetPeriodType,
  referenceDate: Date = new Date()
): Expense[] {
  const { start, end } = getPeriodDateRange(periodType, referenceDate);

  return expenses.filter((expense) => {
    try {
      const expenseDate = parseISO(expense.date);
      return isWithinInterval(expenseDate, { start, end });
    } catch (error) {
      // If date parsing fails, exclude the expense
      console.error("Failed to parse expense date:", expense.date, error);
      return false;
    }
  });
}

/**
 * Calculates the budget status for a given spending limit and expenses
 * @param expenses - Array of all expenses
 * @param limit - The spending limit configuration
 * @param periodType - The type of budget period
 * @param referenceDate - The reference date (defaults to current date)
 * @returns Budget status object
 */
export function calculateBudgetStatus(
  expenses: Expense[],
  limit: SpendingLimit,
  periodType: BudgetPeriodType,
  referenceDate: Date = new Date()
): BudgetStatus {
  const { start, end } = getPeriodDateRange(periodType, referenceDate);
  const expensesInPeriod = getExpensesInPeriod(
    expenses,
    periodType,
    referenceDate
  );

  // Calculate total spent in the period
  const spent = expensesInPeriod.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  // Calculate remaining budget
  const remaining = limit.amount - spent;

  // Calculate percentage
  const percentage = limit.amount > 0 ? (spent / limit.amount) * 100 : 0;

  // Determine warning and exceeded states
  const isWarning = percentage >= 80;
  const isExceeded = percentage > 100;

  return {
    periodType,
    limit: limit.amount,
    spent,
    remaining,
    percentage,
    isWarning,
    isExceeded,
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
  };
}

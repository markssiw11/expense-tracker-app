import {
  endOfMonth,
  isWithinInterval,
  parseISO,
  startOfMonth,
} from "date-fns";
import { Income } from "../types/income.types";

/**
 * Filter incomes belonging to the given month (format YYYY-MM).
 */
export const filterIncomesByMonth = (
  incomes: Income[],
  month: string
): Income[] => {
  try {
    const [year, monthNum] = month.split("-").map(Number);
    const date = new Date(year, monthNum - 1, 1);
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    return incomes.filter((income) => {
      const incomeDate = parseISO(income.date);
      return isWithinInterval(incomeDate, { start, end });
    });
  } catch (error) {
    console.error("Error filtering incomes by month:", error);
    return [];
  }
};

/**
 * Sum the amounts of a list of incomes.
 */
export const calculateIncomeTotal = (incomes: Income[]): number => {
  return incomes.reduce((total, income) => total + income.amount, 0);
};

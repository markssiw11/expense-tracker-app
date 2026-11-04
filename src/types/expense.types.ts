// Expense Types and Interfaces

export enum ExpenseCategory {
  FOOD = "food",
  TRANSPORTATION = "transportation",
  ENTERTAINMENT = "entertainment",
  SHOPPING = "shopping",
  BILLS = "bills",
  HEALTHCARE = "healthcare",
  EDUCATION = "education",
  OTHER = "other",
}

export type ExpenseCategoryValue = string;

export interface CustomExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategoryValue;
  date: string; // ISO date string
  note?: string;
  spender?: string; // Người chi tiêu (vợ, chồng, con, etc.)
  splitExpenseSource?: { tripId: string; expenseId: string };
  createdAt: string;
  updatedAt: string;
}

export interface CategoryConfig {
  key: ExpenseCategoryValue;
  label: string;
  icon: string;
  color: string;
}

export interface MonthlySummary {
  month: string; // Format: YYYY-MM
  totalAmount: number;
  expenseCount: number;
  categoryBreakdown: CategoryBreakdown[];
}

export interface CategoryBreakdown {
  category: ExpenseCategoryValue;
  amount: number;
  percentage: number;
  count: number;
}

export interface SpenderBreakdown {
  spender: string;
  amount: number;
  percentage: number;
  count: number;
  categoryBreakdown: CategoryBreakdown[];
}

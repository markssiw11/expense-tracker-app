// Recurring expense types and interfaces
//
// A recurring rule is a template that automatically generates real Expense
// entries on a schedule (weekly or monthly). Generated expenses are ordinary
// Expense records, so budgets, reports and backups keep working unchanged.

import { ExpenseCategoryValue } from "./expense.types";

export enum RecurrenceFrequency {
  WEEKLY = "weekly",
  MONTHLY = "monthly",
}

export interface RecurringExpense {
  id: string;
  amount: number;
  category: ExpenseCategoryValue;
  note?: string;
  spender?: string;
  frequency: RecurrenceFrequency;
  // ISO date string. The first occurrence date and the anchor for future ones.
  startDate: string;
  // ISO date string of the most recent occurrence that has been generated.
  // Null means no occurrence has been generated yet.
  lastGeneratedDate: string | null;
  // Whether the rule is active. Paused rules generate nothing.
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringExpenseFormData {
  amount: string;
  category: ExpenseCategoryValue | null;
  note: string;
  spender: string | null;
  frequency: RecurrenceFrequency;
  startDate: Date;
}

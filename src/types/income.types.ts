// Income type definitions.
//
// Income is tracked separately from expenses. Budgets remain expense-only;
// income is used to compute the net balance (income - expenses) on the
// dashboard and reports.

export enum IncomeCategory {
  SALARY = "salary",
  BONUS = "bonus",
  INVESTMENT = "investment",
  GIFT = "gift",
  BUSINESS = "business",
  OTHER = "other",
}

export interface Income {
  id: string;
  amount: number;
  category: IncomeCategory;
  date: string; // ISO date string
  note?: string;
  // Who received the income (family member id), optional.
  earner?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeCategoryConfig {
  key: IncomeCategory;
  label: string;
  icon: string;
  color: string;
}

// Spending Limit Types and Interfaces

export enum BudgetPeriodType {
  WEEKLY = "weekly",
  MONTHLY = "monthly",
}

export interface SpendingLimit {
  id: string;
  periodType: BudgetPeriodType;
  amount: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetStatus {
  periodType: BudgetPeriodType;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  isWarning: boolean; // >= 80%
  isExceeded: boolean; // > 100%
  periodStart: string;
  periodEnd: string;
}

export interface SpendingLimitConfig {
  weekly: SpendingLimit | null;
  monthly: SpendingLimit | null;
}

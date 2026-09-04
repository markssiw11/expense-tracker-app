import { Expense } from "../types/expense.types";
import { RecurringExpense } from "../types/recurringExpense.types";
import { getDueOccurrences } from "../utils/recurrenceUtils";

let idCounter = 0;

/**
 * Generate a reasonably unique id for a generated expense.
 * Mirrors the pattern used elsewhere in the app (timestamp + randomness),
 * with an extra counter so multiple occurrences generated in the same
 * millisecond never collide.
 */
const generateExpenseId = (): string => {
  idCounter += 1;
  return `${Date.now()}${idCounter}${Math.random()
    .toString(36)
    .substring(2, 11)}`;
};

export interface GenerationResult {
  newExpenses: Expense[];
  updatedRules: RecurringExpense[];
  generatedCount: number;
}

/**
 * Pure function: given a set of recurring rules and a reference date, compute
 * the expenses that should be created for all due occurrences, plus the rules
 * with their lastGeneratedDate advanced.
 *
 * Disabled rules are skipped and returned unchanged.
 */
export const generateExpensesFromRules = (
  rules: RecurringExpense[],
  referenceDate: Date = new Date()
): GenerationResult => {
  const newExpenses: Expense[] = [];
  const updatedRules: RecurringExpense[] = [];

  for (const rule of rules) {
    if (!rule.enabled) {
      updatedRules.push(rule);
      continue;
    }

    const occurrences = getDueOccurrences(rule, referenceDate);

    if (occurrences.length === 0) {
      updatedRules.push(rule);
      continue;
    }

    const nowIso = new Date().toISOString();
    for (const occurrence of occurrences) {
      newExpenses.push({
        id: generateExpenseId(),
        amount: rule.amount,
        category: rule.category,
        date: occurrence.toISOString(),
        note: rule.note,
        spender: rule.spender,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }

    const lastOccurrence = occurrences[occurrences.length - 1];
    updatedRules.push({
      ...rule,
      lastGeneratedDate: lastOccurrence.toISOString(),
      updatedAt: nowIso,
    });
  }

  return {
    newExpenses,
    updatedRules,
    generatedCount: newExpenses.length,
  };
};

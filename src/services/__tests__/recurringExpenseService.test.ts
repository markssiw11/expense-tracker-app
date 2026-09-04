import { ExpenseCategory } from "../../types/expense.types";
import {
  RecurrenceFrequency,
  RecurringExpense,
} from "../../types/recurringExpense.types";
import { generateExpensesFromRules } from "../recurringExpenseService";

const iso = (y: number, m: number, d: number) =>
  new Date(y, m - 1, d).toISOString();

const makeRule = (
  overrides: Partial<RecurringExpense> = {},
): RecurringExpense => ({
  id: "rule-1",
  amount: 100,
  category: ExpenseCategory.BILLS,
  note: "Rent",
  spender: "husband",
  frequency: RecurrenceFrequency.MONTHLY,
  startDate: iso(2026, 1, 1),
  lastGeneratedDate: null,
  enabled: true,
  createdAt: iso(2026, 1, 1),
  updatedAt: iso(2026, 1, 1),
  ...overrides,
});

describe("generateExpensesFromRules", () => {
  it("generates an expense for a due occurrence and advances the rule", () => {
    const ref = new Date(2026, 0, 5);
    const result = generateExpensesFromRules([makeRule()], ref);

    expect(result.generatedCount).toBe(1);
    expect(result.newExpenses[0].amount).toBe(100);
    expect(result.newExpenses[0].category).toBe(ExpenseCategory.BILLS);
    expect(result.newExpenses[0].note).toBe("Rent");
    expect(result.newExpenses[0].spender).toBe("husband");
    // Rule's lastGeneratedDate should now be the generated occurrence (Jan 1).
    expect(result.updatedRules[0].lastGeneratedDate).toBe(
      new Date(2026, 0, 1).toISOString(),
    );
  });

  it("backfills multiple monthly occurrences", () => {
    const ref = new Date(2026, 2, 15); // Mar 15
    const result = generateExpensesFromRules([makeRule()], ref);
    // Jan, Feb, Mar
    expect(result.generatedCount).toBe(3);
    expect(result.updatedRules[0].lastGeneratedDate).toBe(
      new Date(2026, 2, 1).toISOString(),
    );
  });

  it("skips disabled rules and leaves them unchanged", () => {
    const ref = new Date(2026, 5, 1);
    const rule = makeRule({ enabled: false });
    const result = generateExpensesFromRules([rule], ref);

    expect(result.generatedCount).toBe(0);
    expect(result.updatedRules[0]).toBe(rule);
  });

  it("generates unique expense ids for each occurrence", () => {
    const ref = new Date(2026, 3, 1); // 4 monthly occurrences
    const result = generateExpensesFromRules([makeRule()], ref);
    const ids = new Set(result.newExpenses.map((e) => e.id));
    expect(ids.size).toBe(result.newExpenses.length);
  });

  it("does nothing when the rule is already up to date", () => {
    const ref = new Date(2026, 0, 10);
    const rule = makeRule({ lastGeneratedDate: iso(2026, 1, 1) });
    const result = generateExpensesFromRules([rule], ref);
    expect(result.generatedCount).toBe(0);
  });
});

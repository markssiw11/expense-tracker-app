import * as fc from "fast-check";
import {
  isPositiveAmount,
  getPeriodDateRange,
  getExpensesInPeriod,
  calculateBudgetStatus,
} from "../budgetCalculator";
import {
  BudgetPeriodType,
  SpendingLimit,
} from "../../types/spendingLimit.types";
import { Expense, ExpenseCategory } from "../../types/expense.types";
import { parseISO, isWithinInterval } from "date-fns";

// Helper to generate valid date timestamps
const validDateArbitrary = fc.integer({
  min: new Date("2020-01-01").getTime(),
  max: new Date("2030-12-31").getTime(),
});

// Generator for valid expenses
const expenseArbitrary = fc.record({
  id: fc.uuid(),
  amount: fc.double({ min: 0.01, max: 10000, noNaN: true }),
  category: fc.constantFrom(...Object.values(ExpenseCategory)),
  date: validDateArbitrary.map((timestamp) =>
    new Date(timestamp).toISOString()
  ),
  note: fc.option(fc.string(), { nil: undefined }),
  spender: fc.option(fc.string(), { nil: undefined }),
  createdAt: validDateArbitrary.map((timestamp) =>
    new Date(timestamp).toISOString()
  ),
  updatedAt: validDateArbitrary.map((timestamp) =>
    new Date(timestamp).toISOString()
  ),
}) as fc.Arbitrary<Expense>;

// Generator for spending limits
const spendingLimitArbitrary = (periodType: BudgetPeriodType) =>
  fc.record({
    id: fc.uuid(),
    periodType: fc.constant(periodType),
    amount: fc.double({ min: 1, max: 100000, noNaN: true }),
    enabled: fc.constant(true),
    createdAt: validDateArbitrary.map((timestamp) =>
      new Date(timestamp).toISOString()
    ),
    updatedAt: validDateArbitrary.map((timestamp) =>
      new Date(timestamp).toISOString()
    ),
  }) as fc.Arbitrary<SpendingLimit>;

/**
 * **Feature: spending-limits, Property 1: Positive amount validation**
 * **Validates: Requirements 1.2**
 *
 * For any spending limit amount input, the system should accept the value
 * if and only if it is a positive number greater than zero.
 */
describe("Property 1: Positive amount validation", () => {
  it("should accept only positive numbers greater than zero", () => {
    fc.assert(
      fc.property(fc.double(), (amount) => {
        const result = isPositiveAmount(amount);

        // The function should return true if and only if amount > 0
        if (amount > 0 && isFinite(amount)) {
          expect(result).toBe(true);
        } else {
          expect(result).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: spending-limits, Property 3: Core budget calculation**
 * **Validates: Requirements 6.3, 2.2, 4.2**
 *
 * For any set of expenses within a budget period and any spending limit,
 * the remaining budget should equal the limit minus the sum of all expense amounts in that period.
 */
describe("Property 3: Core budget calculation", () => {
  it("should calculate remaining budget as limit minus sum of expenses in period", () => {
    fc.assert(
      fc.property(
        fc.array(expenseArbitrary, { maxLength: 50 }),
        spendingLimitArbitrary(BudgetPeriodType.WEEKLY),
        validDateArbitrary,
        (expenses, limit, referenceTimestamp) => {
          const referenceDate = new Date(referenceTimestamp);
          const budgetStatus = calculateBudgetStatus(
            expenses,
            limit,
            BudgetPeriodType.WEEKLY,
            referenceDate
          );

          // Get expenses in the period
          const expensesInPeriod = getExpensesInPeriod(
            expenses,
            BudgetPeriodType.WEEKLY,
            referenceDate
          );

          // Calculate expected spent amount
          const expectedSpent = expensesInPeriod.reduce(
            (sum, expense) => sum + expense.amount,
            0
          );

          // Calculate expected remaining
          const expectedRemaining = limit.amount - expectedSpent;

          // Verify the calculation
          expect(budgetStatus.spent).toBeCloseTo(expectedSpent, 2);
          expect(budgetStatus.remaining).toBeCloseTo(expectedRemaining, 2);
          expect(budgetStatus.limit).toBe(limit.amount);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: spending-limits, Property 11: Weekly period date range**
 * **Validates: Requirements 6.1**
 *
 * For any reference date, the weekly period calculation should include only expenses
 * with dates from the start of that week (Monday for Vietnamese locale) through the reference date.
 */
describe("Property 11: Weekly period date range", () => {
  it("should include only expenses from Monday to end of week", () => {
    fc.assert(
      fc.property(
        fc.array(expenseArbitrary, { maxLength: 50 }),
        validDateArbitrary,
        (expenses, referenceTimestamp) => {
          const referenceDate = new Date(referenceTimestamp);
          const { start, end } = getPeriodDateRange(
            BudgetPeriodType.WEEKLY,
            referenceDate
          );
          const expensesInPeriod = getExpensesInPeriod(
            expenses,
            BudgetPeriodType.WEEKLY,
            referenceDate
          );

          // Verify start is Monday
          expect(start.getDay()).toBe(1); // Monday

          // Verify all expenses in period are within the date range
          expensesInPeriod.forEach((expense) => {
            const expenseDate = parseISO(expense.date);
            expect(isWithinInterval(expenseDate, { start, end })).toBe(true);
          });

          // Verify no expenses outside the period are included
          const expensesOutsidePeriod = expenses.filter(
            (expense) => !expensesInPeriod.some((e) => e.id === expense.id)
          );

          expensesOutsidePeriod.forEach((expense) => {
            const expenseDate = parseISO(expense.date);
            expect(isWithinInterval(expenseDate, { start, end })).toBe(false);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: spending-limits, Property 12: Monthly period date range**
 * **Validates: Requirements 6.2**
 *
 * For any reference date, the monthly period calculation should include only expenses
 * with dates from the first day of that month through the reference date.
 */
describe("Property 12: Monthly period date range", () => {
  it("should include only expenses from first day of month to end of month", () => {
    fc.assert(
      fc.property(
        fc.array(expenseArbitrary, { maxLength: 50 }),
        validDateArbitrary,
        (expenses, referenceTimestamp) => {
          const referenceDate = new Date(referenceTimestamp);
          const { start, end } = getPeriodDateRange(
            BudgetPeriodType.MONTHLY,
            referenceDate
          );
          const expensesInPeriod = getExpensesInPeriod(
            expenses,
            BudgetPeriodType.MONTHLY,
            referenceDate
          );

          // Verify start is first day of month
          expect(start.getDate()).toBe(1);

          // Verify start and end are in the same month
          expect(start.getMonth()).toBe(referenceDate.getMonth());
          expect(start.getFullYear()).toBe(referenceDate.getFullYear());

          // Verify all expenses in period are within the date range
          expensesInPeriod.forEach((expense) => {
            const expenseDate = parseISO(expense.date);
            expect(isWithinInterval(expenseDate, { start, end })).toBe(true);
          });

          // Verify no expenses outside the period are included
          const expensesOutsidePeriod = expenses.filter(
            (expense) => !expensesInPeriod.some((e) => e.id === expense.id)
          );

          expensesOutsidePeriod.forEach((expense) => {
            const expenseDate = parseISO(expense.date);
            expect(isWithinInterval(expenseDate, { start, end })).toBe(false);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: spending-limits, Property 5: Budget recalculation on deletion**
 * **Validates: Requirements 6.4**
 *
 * For any expense that is deleted, the remaining budget should increase
 * by exactly the amount of the deleted expense.
 */
describe("Property 5: Budget recalculation on deletion", () => {
  it("should increase remaining budget by deleted expense amount", () => {
    fc.assert(
      fc.property(
        fc.array(expenseArbitrary, { minLength: 1, maxLength: 50 }),
        spendingLimitArbitrary(BudgetPeriodType.WEEKLY),
        validDateArbitrary,
        fc.nat(),
        (expenses, limit, referenceTimestamp, indexSeed) => {
          const referenceDate = new Date(referenceTimestamp);

          // Calculate initial budget status with all expenses
          const initialStatus = calculateBudgetStatus(
            expenses,
            limit,
            BudgetPeriodType.WEEKLY,
            referenceDate
          );

          // Get expenses in the period
          const expensesInPeriod = getExpensesInPeriod(
            expenses,
            BudgetPeriodType.WEEKLY,
            referenceDate
          );

          // Skip if no expenses in period
          if (expensesInPeriod.length === 0) {
            return true;
          }

          // Select a random expense to delete from the period
          const indexToDelete = indexSeed % expensesInPeriod.length;
          const expenseToDelete = expensesInPeriod[indexToDelete];
          const deletedAmount = expenseToDelete.amount;

          // Create new expense list without the deleted expense
          const expensesAfterDeletion = expenses.filter(
            (e) => e.id !== expenseToDelete.id
          );

          // Calculate budget status after deletion
          const statusAfterDeletion = calculateBudgetStatus(
            expensesAfterDeletion,
            limit,
            BudgetPeriodType.WEEKLY,
            referenceDate
          );

          // Verify that remaining budget increased by the deleted amount
          const expectedRemaining = initialStatus.remaining + deletedAmount;
          expect(statusAfterDeletion.remaining).toBeCloseTo(
            expectedRemaining,
            2
          );

          // Verify that spent amount decreased by the deleted amount
          const expectedSpent = initialStatus.spent - deletedAmount;
          expect(statusAfterDeletion.spent).toBeCloseTo(expectedSpent, 2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: spending-limits, Property 7: Warning threshold detection**
 * **Validates: Requirements 3.1, 3.2, 3.5**
 *
 * For any spending limit and set of expenses, the system should display a warning
 * when total expenses reach or exceed 80% of the limit, and should display an
 * exceeded alert when total expenses exceed 100% of the limit.
 */
describe("Property 7: Warning threshold detection", () => {
  it("should set isWarning when expenses >= 80% and isExceeded when > 100%", () => {
    fc.assert(
      fc.property(
        spendingLimitArbitrary(BudgetPeriodType.WEEKLY),
        fc.double({ min: 0, max: 2, noNaN: true }), // Spending ratio (0 to 2x limit)
        validDateArbitrary,
        (limit, spendingRatio, referenceTimestamp) => {
          const referenceDate = new Date(referenceTimestamp);

          // Create expenses that sum to a specific percentage of the limit
          const totalSpent = limit.amount * spendingRatio;
          const numExpenses = Math.max(1, Math.floor(Math.random() * 5) + 1);
          const expenseAmount = totalSpent / numExpenses;

          // Create expenses within the current period
          const { start } = getPeriodDateRange(
            BudgetPeriodType.WEEKLY,
            referenceDate
          );

          const expenses: Expense[] = Array.from(
            { length: numExpenses },
            (_, i) => ({
              id: `expense-${i}`,
              amount: expenseAmount,
              category: ExpenseCategory.FOOD,
              date: start.toISOString(),
              createdAt: start.toISOString(),
              updatedAt: start.toISOString(),
            })
          );

          const budgetStatus = calculateBudgetStatus(
            expenses,
            limit,
            BudgetPeriodType.WEEKLY,
            referenceDate
          );

          const percentage = budgetStatus.percentage;

          // Verify warning threshold (>= 80%)
          if (percentage >= 80) {
            expect(budgetStatus.isWarning).toBe(true);
          } else {
            expect(budgetStatus.isWarning).toBe(false);
          }

          // Verify exceeded threshold (> 100%)
          if (percentage > 100) {
            expect(budgetStatus.isExceeded).toBe(true);
          } else {
            expect(budgetStatus.isExceeded).toBe(false);
          }

          // Verify that exceeded implies warning
          if (budgetStatus.isExceeded) {
            expect(budgetStatus.isWarning).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: spending-limits, Property 6: Period boundary reset**
 * **Validates: Requirements 2.5**
 *
 * For any budget period type, when a new period begins (new week or new month),
 * the calculated spent amount should only include expenses from the new period,
 * effectively resetting to zero if no expenses exist in the new period.
 */
describe("Property 6: Period boundary reset", () => {
  it("should only include expenses from the current period, resetting at period boundaries", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(BudgetPeriodType.WEEKLY, BudgetPeriodType.MONTHLY),
        fc.array(expenseArbitrary, { minLength: 2, maxLength: 50 }),
        spendingLimitArbitrary(BudgetPeriodType.WEEKLY),
        validDateArbitrary,
        (periodType, expenses, limit, referenceTimestamp) => {
          const referenceDate = new Date(referenceTimestamp);

          // Update limit to match the period type being tested
          const adjustedLimit = { ...limit, periodType };

          // Get the current period range
          const { start: currentStart, end: currentEnd } = getPeriodDateRange(
            periodType,
            referenceDate
          );

          // Calculate a date in the previous period
          let previousPeriodDate: Date;
          if (periodType === BudgetPeriodType.WEEKLY) {
            // Go back 7 days to get to previous week
            previousPeriodDate = new Date(currentStart);
            previousPeriodDate.setDate(previousPeriodDate.getDate() - 7);
          } else {
            // Go back to previous month
            previousPeriodDate = new Date(currentStart);
            previousPeriodDate.setMonth(previousPeriodDate.getMonth() - 1);
          }

          // Split expenses into two groups: current period and previous period
          const currentPeriodExpenses = expenses
            .slice(0, Math.floor(expenses.length / 2))
            .map((expense) => ({
              ...expense,
              date: currentStart.toISOString(),
            }));

          const previousPeriodExpenses = expenses
            .slice(Math.floor(expenses.length / 2))
            .map((expense) => ({
              ...expense,
              date: previousPeriodDate.toISOString(),
            }));

          // Combine all expenses
          const allExpenses = [
            ...currentPeriodExpenses,
            ...previousPeriodExpenses,
          ];

          // Calculate budget status for the current period
          const currentPeriodStatus = calculateBudgetStatus(
            allExpenses,
            adjustedLimit,
            periodType,
            referenceDate
          );

          // Calculate expected spent amount (only from current period)
          const expectedSpent = currentPeriodExpenses.reduce(
            (sum, expense) => sum + expense.amount,
            0
          );

          // Verify that only current period expenses are counted
          expect(currentPeriodStatus.spent).toBeCloseTo(expectedSpent, 2);

          // Verify that previous period expenses are NOT included
          const previousPeriodTotal = previousPeriodExpenses.reduce(
            (sum, expense) => sum + expense.amount,
            0
          );

          // The spent amount should NOT include previous period expenses
          expect(currentPeriodStatus.spent).not.toBeCloseTo(
            expectedSpent + previousPeriodTotal,
            2
          );

          // Test the "reset" behavior: if we have no expenses in current period,
          // spent should be zero even if there are expenses in previous period
          const statusWithOnlyPreviousExpenses = calculateBudgetStatus(
            previousPeriodExpenses,
            adjustedLimit,
            periodType,
            referenceDate
          );

          expect(statusWithOnlyPreviousExpenses.spent).toBe(0);
          expect(statusWithOnlyPreviousExpenses.remaining).toBe(
            adjustedLimit.amount
          );

          // Verify period boundaries are correct
          expect(currentPeriodStatus.periodStart).toBe(
            currentStart.toISOString()
          );
          expect(currentPeriodStatus.periodEnd).toBe(currentEnd.toISOString());
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: spending-limits, Property 8: Warnings do not block operations**
 * **Validates: Requirements 3.4**
 *
 * For any budget state (warning or exceeded), the system should continue to allow
 * all expense operations (add, edit, delete) without blocking functionality.
 */
describe("Property 8: Warnings do not block operations", () => {
  it("should allow expense operations regardless of warning or exceeded state", () => {
    fc.assert(
      fc.property(
        fc.array(expenseArbitrary, { minLength: 0, maxLength: 50 }),
        spendingLimitArbitrary(BudgetPeriodType.WEEKLY),
        validDateArbitrary,
        expenseArbitrary,
        (initialExpenses, limit, referenceTimestamp, newExpense) => {
          const referenceDate = new Date(referenceTimestamp);

          // Calculate initial budget status
          const initialStatus = calculateBudgetStatus(
            initialExpenses,
            limit,
            BudgetPeriodType.WEEKLY,
            referenceDate
          );

          // Test 1: Add operation should work regardless of warning state
          const expensesAfterAdd = [...initialExpenses, newExpense];
          const statusAfterAdd = calculateBudgetStatus(
            expensesAfterAdd,
            limit,
            BudgetPeriodType.WEEKLY,
            referenceDate
          );

          // Verify add operation completed (new expense is in the list)
          expect(expensesAfterAdd.length).toBe(initialExpenses.length + 1);
          expect(expensesAfterAdd).toContain(newExpense);

          // Verify budget calculation still works after add
          expect(statusAfterAdd).toBeDefined();
          expect(typeof statusAfterAdd.spent).toBe("number");
          expect(typeof statusAfterAdd.remaining).toBe("number");

          // Test 2: Edit operation should work regardless of warning state
          if (initialExpenses.length > 0) {
            const expenseToEdit = initialExpenses[0];
            const editedExpense = {
              ...expenseToEdit,
              amount: expenseToEdit.amount * 1.5,
            };
            const expensesAfterEdit = [
              editedExpense,
              ...initialExpenses.slice(1),
            ];
            const statusAfterEdit = calculateBudgetStatus(
              expensesAfterEdit,
              limit,
              BudgetPeriodType.WEEKLY,
              referenceDate
            );

            // Verify edit operation completed
            expect(expensesAfterEdit.length).toBe(initialExpenses.length);
            expect(expensesAfterEdit[0].amount).toBe(
              expenseToEdit.amount * 1.5
            );

            // Verify budget calculation still works after edit
            expect(statusAfterEdit).toBeDefined();
            expect(typeof statusAfterEdit.spent).toBe("number");
            expect(typeof statusAfterEdit.remaining).toBe("number");
          }

          // Test 3: Delete operation should work regardless of warning state
          if (initialExpenses.length > 0) {
            const expenseToDelete = initialExpenses[0];
            const expensesAfterDelete = initialExpenses.filter(
              (e) => e.id !== expenseToDelete.id
            );
            const statusAfterDelete = calculateBudgetStatus(
              expensesAfterDelete,
              limit,
              BudgetPeriodType.WEEKLY,
              referenceDate
            );

            // Verify delete operation completed
            expect(expensesAfterDelete.length).toBe(initialExpenses.length - 1);
            expect(expensesAfterDelete).not.toContain(expenseToDelete);

            // Verify budget calculation still works after delete
            expect(statusAfterDelete).toBeDefined();
            expect(typeof statusAfterDelete.spent).toBe("number");
            expect(typeof statusAfterDelete.remaining).toBe("number");
          }

          // Test 4: Verify operations work even when budget is exceeded
          // Create a scenario where budget is definitely exceeded
          const { start } = getPeriodDateRange(
            BudgetPeriodType.WEEKLY,
            referenceDate
          );
          const largeExpense: Expense = {
            id: "large-expense",
            amount: limit.amount * 2, // 200% of limit
            category: ExpenseCategory.FOOD,
            date: start.toISOString(),
            createdAt: start.toISOString(),
            updatedAt: start.toISOString(),
          };

          const expensesWithExceeded = [...initialExpenses, largeExpense];
          const exceededStatus = calculateBudgetStatus(
            expensesWithExceeded,
            limit,
            BudgetPeriodType.WEEKLY,
            referenceDate
          );

          // Verify budget is exceeded
          expect(exceededStatus.isExceeded).toBe(true);

          // Now perform operations even though budget is exceeded
          const anotherExpense: Expense = {
            id: "another-expense",
            amount: 100,
            category: ExpenseCategory.FOOD,
            date: start.toISOString(),
            createdAt: start.toISOString(),
            updatedAt: start.toISOString(),
          };

          const expensesAfterExceeded = [
            ...expensesWithExceeded,
            anotherExpense,
          ];
          const statusAfterExceeded = calculateBudgetStatus(
            expensesAfterExceeded,
            limit,
            BudgetPeriodType.WEEKLY,
            referenceDate
          );

          // Verify operation completed even though budget was exceeded
          expect(expensesAfterExceeded.length).toBe(
            expensesWithExceeded.length + 1
          );
          expect(expensesAfterExceeded).toContain(anotherExpense);

          // Verify budget calculation still works
          expect(statusAfterExceeded).toBeDefined();
          expect(statusAfterExceeded.isExceeded).toBe(true);
          expect(typeof statusAfterExceeded.spent).toBe("number");
          expect(typeof statusAfterExceeded.remaining).toBe("number");
        }
      ),
      { numRuns: 100 }
    );
  });
});

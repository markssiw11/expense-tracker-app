import * as fc from "fast-check";
import { configureStore, Reducer } from "@reduxjs/toolkit";
import spendingLimitReducer, {
  loadConfig,
  saveLimit,
  updateLimit,
  deleteLimit,
  toggleLimit,
  selectBudgetStatus,
  selectWeeklyBudgetStatus,
  selectMonthlyBudgetStatus,
} from "../spendingLimitSlice";
import expenseReducer from "../expenseSlice";
import {
  BudgetPeriodType,
  SpendingLimit,
  SpendingLimitConfig,
} from "../../../types/spendingLimit.types";
import { Expense, ExpenseCategory } from "../../../types/expense.types";
import spendingLimitStorage from "../../../services/storage/spendingLimitStorage";

// Mock the storage service
jest.mock("../../../services/storage/spendingLimitStorage");

// Helper to create a test store
const createTestStore = (preloadedState?: any) => {
  const store = configureStore({
    reducer: {
      spendingLimit: spendingLimitReducer,
      expenses: expenseReducer,
      notes: (state = {}) => state,
      family: (state = {}) => state,
      auth: (state = {}) => state,
      events: (state = {}) => state,
    } as any,
    preloadedState,
  });
  return store;
};

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
    enabled: fc.boolean(),
    createdAt: validDateArbitrary.map((timestamp) =>
      new Date(timestamp).toISOString()
    ),
    updatedAt: validDateArbitrary.map((timestamp) =>
      new Date(timestamp).toISOString()
    ),
  }) as fc.Arbitrary<SpendingLimit>;

// Generator for spending limit config
const spendingLimitConfigArbitrary = fc.record({
  weekly: fc.option(spendingLimitArbitrary(BudgetPeriodType.WEEKLY), {
    nil: null,
  }),
  monthly: fc.option(spendingLimitArbitrary(BudgetPeriodType.MONTHLY), {
    nil: null,
  }),
}) as fc.Arbitrary<SpendingLimitConfig>;

/**
 * **Feature: spending-limits, Property 4: Budget recalculation on modification**
 * **Validates: Requirements 1.5, 6.5, 5.2**
 *
 * For any existing spending limit and any valid modification (amount change or re-enabling),
 * the system should recalculate the remaining budget immediately based on current period expenses.
 */
describe("Property 4: Budget recalculation on modification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should recalculate budget when limit amount is modified", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(expenseArbitrary, { minLength: 1, maxLength: 20 }),
        spendingLimitArbitrary(BudgetPeriodType.WEEKLY),
        fc.double({ min: 1, max: 100000, noNaN: true }),
        async (expenses, initialLimit, newAmount) => {
          // Setup: Create store with initial limit and expenses
          const store = createTestStore({
            spendingLimit: {
              config: {
                weekly: initialLimit,
                monthly: null,
              },
              budgetStatus: {
                weekly: null,
                monthly: null,
              },
              loading: false,
              error: null,
            },
            expenses: {
              expenses,
              loading: false,
              error: null,
              selectedMonth: new Date().toISOString().substring(0, 7),
              filters: { categories: [] },
            },
          });

          // Mock storage update
          (spendingLimitStorage.updateLimit as jest.Mock).mockResolvedValue(
            undefined
          );

          // Get initial budget status
          const initialBudgetStatus = selectWeeklyBudgetStatus(
            store.getState() as any
          );

          // Modify the limit amount
          await store.dispatch(
            updateLimit({
              periodType: BudgetPeriodType.WEEKLY,
              amount: newAmount,
              enabled: true,
            })
          );

          // Get new budget status after modification
          const newBudgetStatus = selectWeeklyBudgetStatus(
            store.getState() as any
          );

          // Verify budget was recalculated
          expect(newBudgetStatus).not.toBeNull();
          if (newBudgetStatus && initialBudgetStatus) {
            // The limit should have changed
            expect(newBudgetStatus.limit).toBe(newAmount);

            // The spent amount should remain the same (same expenses)
            expect(newBudgetStatus.spent).toBeCloseTo(
              initialBudgetStatus.spent,
              2
            );

            // The remaining should be recalculated: new limit - spent
            expect(newBudgetStatus.remaining).toBeCloseTo(
              newAmount - initialBudgetStatus.spent,
              2
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should recalculate budget when limit is re-enabled", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(expenseArbitrary, { minLength: 1, maxLength: 20 }),
        spendingLimitArbitrary(BudgetPeriodType.MONTHLY),
        async (expenses, initialLimit) => {
          // Start with disabled limit
          const disabledLimit = { ...initialLimit, enabled: false };

          // Setup: Create store with disabled limit and expenses
          const store = createTestStore({
            spendingLimit: {
              config: {
                weekly: null,
                monthly: disabledLimit,
              },
              budgetStatus: {
                weekly: null,
                monthly: null,
              },
              loading: false,
              error: null,
            },
            expenses: {
              expenses,
              loading: false,
              error: null,
              selectedMonth: new Date().toISOString().substring(0, 7),
              filters: { categories: [] },
            },
          });

          // Mock storage update
          (spendingLimitStorage.updateLimit as jest.Mock).mockResolvedValue(
            undefined
          );

          // Initially, budget status should be null (disabled)
          const initialBudgetStatus = selectMonthlyBudgetStatus(
            store.getState() as any
          );
          expect(initialBudgetStatus).toBeNull();

          // Re-enable the limit
          await store.dispatch(
            updateLimit({
              periodType: BudgetPeriodType.MONTHLY,
              enabled: true,
            })
          );

          // Get new budget status after re-enabling
          const newBudgetStatus = selectMonthlyBudgetStatus(
            store.getState() as any
          );

          // Verify budget was calculated based on current period expenses
          expect(newBudgetStatus).not.toBeNull();
          if (newBudgetStatus) {
            expect(newBudgetStatus.limit).toBe(disabledLimit.amount);
            expect(newBudgetStatus.spent).toBeGreaterThanOrEqual(0);
            expect(newBudgetStatus.remaining).toBe(
              disabledLimit.amount - newBudgetStatus.spent
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: spending-limits, Property 9: Disabled state behavior**
 * **Validates: Requirements 5.1, 5.3**
 *
 * For any spending limit that is disabled, the system should not display warnings
 * or budget information for that period type, but should retain the configured limit amount.
 */
describe("Property 9: Disabled state behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not calculate budget status for disabled limits but retain amount", () => {
    fc.assert(
      fc.property(
        fc.array(expenseArbitrary, { maxLength: 20 }),
        spendingLimitConfigArbitrary,
        (expenses, config) => {
          // Create store with the config and expenses
          const store = createTestStore({
            spendingLimit: {
              config,
              budgetStatus: {
                weekly: null,
                monthly: null,
              },
              loading: false,
              error: null,
            },
            expenses: {
              expenses,
              loading: false,
              error: null,
              selectedMonth: new Date().toISOString().substring(0, 7),
              filters: { categories: [] },
            },
          });

          const budgetStatus = selectBudgetStatus(store.getState() as any);

          // Check weekly limit
          if (config.weekly) {
            if (config.weekly.enabled) {
              // If enabled, budget status should be calculated
              expect(budgetStatus.weekly).not.toBeNull();
              if (budgetStatus.weekly) {
                expect(budgetStatus.weekly.limit).toBe(config.weekly.amount);
              }
            } else {
              // If disabled, budget status should be null
              expect(budgetStatus.weekly).toBeNull();
            }

            // Verify the limit amount is retained in config regardless of enabled state
            const state = store.getState() as any;
            expect(state.spendingLimit.config.weekly?.amount).toBe(
              config.weekly.amount
            );
          }

          // Check monthly limit
          if (config.monthly) {
            if (config.monthly.enabled) {
              // If enabled, budget status should be calculated
              expect(budgetStatus.monthly).not.toBeNull();
              if (budgetStatus.monthly) {
                expect(budgetStatus.monthly.limit).toBe(config.monthly.amount);
              }
            } else {
              // If disabled, budget status should be null
              expect(budgetStatus.monthly).toBeNull();
            }

            // Verify the limit amount is retained in config regardless of enabled state
            const state = store.getState() as any;
            expect(state.spendingLimit.config.monthly?.amount).toBe(
              config.monthly.amount
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: spending-limits, Property 13: Simultaneous period tracking**
 * **Validates: Requirements 1.4**
 *
 * For any configuration where both weekly and monthly limits are enabled,
 * the system should independently calculate and display budget status for both periods without interference.
 */
describe("Property 13: Simultaneous period tracking", () => {
  it("should independently track weekly and monthly budgets simultaneously", () => {
    fc.assert(
      fc.property(
        fc.array(expenseArbitrary, { minLength: 1, maxLength: 30 }),
        spendingLimitArbitrary(BudgetPeriodType.WEEKLY),
        spendingLimitArbitrary(BudgetPeriodType.MONTHLY),
        (expenses, weeklyLimit, monthlyLimit) => {
          // Ensure both limits are enabled
          const enabledWeeklyLimit = { ...weeklyLimit, enabled: true };
          const enabledMonthlyLimit = { ...monthlyLimit, enabled: true };

          // Create store with both limits enabled
          const store = createTestStore({
            spendingLimit: {
              config: {
                weekly: enabledWeeklyLimit,
                monthly: enabledMonthlyLimit,
              },
              budgetStatus: {
                weekly: null,
                monthly: null,
              },
              loading: false,
              error: null,
            },
            expenses: {
              expenses,
              loading: false,
              error: null,
              selectedMonth: new Date().toISOString().substring(0, 7),
              filters: { categories: [] },
            },
          });

          const budgetStatus = selectBudgetStatus(store.getState() as any);

          // Both budget statuses should be calculated
          expect(budgetStatus.weekly).not.toBeNull();
          expect(budgetStatus.monthly).not.toBeNull();

          if (budgetStatus.weekly && budgetStatus.monthly) {
            // Verify weekly budget status
            expect(budgetStatus.weekly.periodType).toBe(
              BudgetPeriodType.WEEKLY
            );
            expect(budgetStatus.weekly.limit).toBe(enabledWeeklyLimit.amount);
            expect(budgetStatus.weekly.spent).toBeGreaterThanOrEqual(0);
            expect(budgetStatus.weekly.remaining).toBe(
              enabledWeeklyLimit.amount - budgetStatus.weekly.spent
            );

            // Verify monthly budget status
            expect(budgetStatus.monthly.periodType).toBe(
              BudgetPeriodType.MONTHLY
            );
            expect(budgetStatus.monthly.limit).toBe(enabledMonthlyLimit.amount);
            expect(budgetStatus.monthly.spent).toBeGreaterThanOrEqual(0);
            expect(budgetStatus.monthly.remaining).toBe(
              enabledMonthlyLimit.amount - budgetStatus.monthly.spent
            );

            // Verify independence: both budgets are calculated correctly
            // Weekly spent should be <= monthly spent (week is subset of month)
            // but they can be equal if all expenses fall in both periods
            expect(budgetStatus.weekly.spent).toBeLessThanOrEqual(
              budgetStatus.monthly.spent
            );

            // Verify that changing one limit doesn't affect the other's calculation
            // Both should have their own independent period calculations
            expect(budgetStatus.weekly.periodType).not.toBe(
              budgetStatus.monthly.periodType
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: spending-limits, Property 10: Expense tracking independence**
 * **Validates: Requirements 5.5**
 *
 * For any spending limit state (enabled or disabled), all expense operations
 * should function normally and expenses should be tracked in storage.
 */
describe("Property 10: Expense tracking independence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should allow expense operations regardless of spending limit state", () => {
    fc.assert(
      fc.property(
        fc.array(expenseArbitrary, { minLength: 1, maxLength: 20 }),
        spendingLimitConfigArbitrary,
        expenseArbitrary,
        (initialExpenses, config, newExpense) => {
          // Create store with various spending limit configurations
          const store = createTestStore({
            spendingLimit: {
              config,
              budgetStatus: {
                weekly: null,
                monthly: null,
              },
              loading: false,
              error: null,
            },
            expenses: {
              expenses: initialExpenses,
              loading: false,
              error: null,
              selectedMonth: new Date().toISOString().substring(0, 7),
              filters: { categories: [] },
            },
          });

          // Get initial expense count
          const initialState = store.getState() as any;
          const initialExpenseCount = initialState.expenses.expenses.length;

          // Verify we can add an expense regardless of limit state
          store.dispatch({
            type: "expenses/addExpense/fulfilled",
            payload: newExpense,
          });

          const stateAfterAdd = store.getState() as any;
          const expenseCountAfterAdd = stateAfterAdd.expenses.expenses.length;

          // Expense should be added successfully
          expect(expenseCountAfterAdd).toBe(initialExpenseCount + 1);
          expect(
            stateAfterAdd.expenses.expenses.find(
              (e: Expense) => e.id === newExpense.id
            )
          ).toBeDefined();

          // Verify we can update an expense regardless of limit state
          if (initialExpenses.length > 0) {
            const expenseToUpdate = initialExpenses[0];
            const updatedData = { amount: 999.99 };

            store.dispatch({
              type: "expenses/updateExpense/fulfilled",
              payload: { id: expenseToUpdate.id, data: updatedData },
            });

            const stateAfterUpdate = store.getState() as any;
            const updatedExpense = stateAfterUpdate.expenses.expenses.find(
              (e: Expense) => e.id === expenseToUpdate.id
            );

            // Expense should be updated successfully
            expect(updatedExpense).toBeDefined();
            expect(updatedExpense.amount).toBe(999.99);
          }

          // Verify we can delete an expense regardless of limit state
          if (initialExpenses.length > 0) {
            const expenseToDelete = initialExpenses[0];

            store.dispatch({
              type: "expenses/deleteExpense/fulfilled",
              payload: expenseToDelete.id,
            });

            const stateAfterDelete = store.getState() as any;
            const deletedExpense = stateAfterDelete.expenses.expenses.find(
              (e: Expense) => e.id === expenseToDelete.id
            );

            // Expense should be deleted successfully
            expect(deletedExpense).toBeUndefined();
          }

          // Verify that all operations completed without errors
          const finalState = store.getState() as any;
          expect(finalState.expenses.error).toBeNull();

          // Verify spending limit state is independent and unchanged
          expect(finalState.spendingLimit.config).toEqual(config);
        }
      ),
      { numRuns: 100 }
    );
  });
});

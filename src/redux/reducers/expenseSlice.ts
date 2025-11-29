import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Expense, ExpenseCategory } from "../../types";
import expenseStorage from "../../services/storage/expenseStorage";
import { getCurrentMonth } from "../../utils/expenseUtils";
import { updateBudgetStatus } from "./spendingLimitSlice";
import { calculateBudgetStatus } from "../../utils/budgetCalculator";
import { BudgetPeriodType } from "../../types";

interface ExpenseState {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  selectedMonth: string;
  filters: {
    categories: ExpenseCategory[];
  };
}

const initialState: ExpenseState = {
  expenses: [],
  loading: false,
  error: null,
  selectedMonth: getCurrentMonth(),
  filters: {
    categories: [],
  },
};

// Async thunks
export const loadExpenses = createAsyncThunk(
  "expenses/loadExpenses",
  async (_, { rejectWithValue, dispatch, getState }) => {
    try {
      const expenses = await expenseStorage.loadExpenses();

      // Trigger budget recalculation after loading expenses
      const state = getState() as any;
      const spendingLimitConfig = state.spendingLimit?.config;

      if (spendingLimitConfig) {
        const weeklyStatus = spendingLimitConfig.weekly?.enabled
          ? calculateBudgetStatus(
              expenses,
              spendingLimitConfig.weekly,
              BudgetPeriodType.WEEKLY
            )
          : null;

        const monthlyStatus = spendingLimitConfig.monthly?.enabled
          ? calculateBudgetStatus(
              expenses,
              spendingLimitConfig.monthly,
              BudgetPeriodType.MONTHLY
            )
          : null;

        dispatch(
          updateBudgetStatus({ weekly: weeklyStatus, monthly: monthlyStatus })
        );
      }

      return expenses;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to load expenses"
      );
    }
  }
);

export const addExpense = createAsyncThunk(
  "expenses/addExpense",
  async (expense: Expense, { rejectWithValue, dispatch, getState }) => {
    try {
      await expenseStorage.addExpense(expense);

      // Trigger budget recalculation after adding expense
      const state = getState() as any;
      const expenses = [...state.expenses.expenses, expense];
      const spendingLimitConfig = state.spendingLimit?.config;

      if (spendingLimitConfig) {
        const weeklyStatus = spendingLimitConfig.weekly?.enabled
          ? calculateBudgetStatus(
              expenses,
              spendingLimitConfig.weekly,
              BudgetPeriodType.WEEKLY
            )
          : null;

        const monthlyStatus = spendingLimitConfig.monthly?.enabled
          ? calculateBudgetStatus(
              expenses,
              spendingLimitConfig.monthly,
              BudgetPeriodType.MONTHLY
            )
          : null;

        dispatch(
          updateBudgetStatus({ weekly: weeklyStatus, monthly: monthlyStatus })
        );
      }

      return expense;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to add expense"
      );
    }
  }
);

export const updateExpense = createAsyncThunk(
  "expenses/updateExpense",
  async (
    { id, data }: { id: string; data: Partial<Expense> },
    { rejectWithValue, dispatch, getState }
  ) => {
    try {
      await expenseStorage.updateExpense(id, data);

      // Trigger budget recalculation after updating expense
      const state = getState() as any;
      const expenses = state.expenses.expenses.map((e: Expense) =>
        e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e
      );
      const spendingLimitConfig = state.spendingLimit?.config;

      if (spendingLimitConfig) {
        const weeklyStatus = spendingLimitConfig.weekly?.enabled
          ? calculateBudgetStatus(
              expenses,
              spendingLimitConfig.weekly,
              BudgetPeriodType.WEEKLY
            )
          : null;

        const monthlyStatus = spendingLimitConfig.monthly?.enabled
          ? calculateBudgetStatus(
              expenses,
              spendingLimitConfig.monthly,
              BudgetPeriodType.MONTHLY
            )
          : null;

        dispatch(
          updateBudgetStatus({ weekly: weeklyStatus, monthly: monthlyStatus })
        );
      }

      return { id, data };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to update expense"
      );
    }
  }
);

export const deleteExpense = createAsyncThunk(
  "expenses/deleteExpense",
  async (id: string, { rejectWithValue, dispatch, getState }) => {
    try {
      await expenseStorage.deleteExpense(id);

      // Trigger budget recalculation after deleting expense
      const state = getState() as any;
      const expenses = state.expenses.expenses.filter(
        (e: Expense) => e.id !== id
      );
      const spendingLimitConfig = state.spendingLimit?.config;

      if (spendingLimitConfig) {
        const weeklyStatus = spendingLimitConfig.weekly?.enabled
          ? calculateBudgetStatus(
              expenses,
              spendingLimitConfig.weekly,
              BudgetPeriodType.WEEKLY
            )
          : null;

        const monthlyStatus = spendingLimitConfig.monthly?.enabled
          ? calculateBudgetStatus(
              expenses,
              spendingLimitConfig.monthly,
              BudgetPeriodType.MONTHLY
            )
          : null;

        dispatch(
          updateBudgetStatus({ weekly: weeklyStatus, monthly: monthlyStatus })
        );
      }

      return id;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to delete expense"
      );
    }
  }
);

const expenseSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    setSelectedMonth: (state, action: PayloadAction<string>) => {
      state.selectedMonth = action.payload;
    },
    setFilters: (
      state,
      action: PayloadAction<{ categories: ExpenseCategory[] }>
    ) => {
      state.filters = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Load expenses
    builder.addCase(loadExpenses.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loadExpenses.fulfilled, (state, action) => {
      state.loading = false;
      state.expenses = action.payload;
    });
    builder.addCase(loadExpenses.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Add expense
    builder.addCase(addExpense.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addExpense.fulfilled, (state, action) => {
      state.loading = false;
      state.expenses.push(action.payload);
    });
    builder.addCase(addExpense.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update expense
    builder.addCase(updateExpense.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateExpense.fulfilled, (state, action) => {
      state.loading = false;
      const { id, data } = action.payload;
      const index = state.expenses.findIndex((e) => e.id === id);
      if (index !== -1) {
        state.expenses[index] = {
          ...state.expenses[index],
          ...data,
          updatedAt: new Date().toISOString(),
        };
      }
    });
    builder.addCase(updateExpense.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete expense
    builder.addCase(deleteExpense.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteExpense.fulfilled, (state, action) => {
      state.loading = false;
      state.expenses = state.expenses.filter((e) => e.id !== action.payload);
    });
    builder.addCase(deleteExpense.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { setSelectedMonth, setFilters, clearError } =
  expenseSlice.actions;
export default expenseSlice.reducer;

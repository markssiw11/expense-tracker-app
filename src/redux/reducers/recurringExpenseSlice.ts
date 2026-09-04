import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { generateExpensesFromRules } from "../../services/recurringExpenseService";
import expenseStorage from "../../services/storage/expenseStorage";
import recurringExpenseStorage from "../../services/storage/recurringExpenseStorage";
import { Expense } from "../../types/expense.types";
import { RecurringExpense } from "../../types/recurringExpense.types";
import { loadExpenses } from "./expenseSlice";

interface RecurringExpenseState {
  rules: RecurringExpense[];
  loading: boolean;
  error: string | null;
}

const initialState: RecurringExpenseState = {
  rules: [],
  loading: false,
  error: null,
};

export const loadRecurringExpenses = createAsyncThunk(
  "recurringExpenses/load",
  async (_, { rejectWithValue }) => {
    try {
      return await recurringExpenseStorage.loadRules();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to load"
      );
    }
  }
);

export const addRecurringExpense = createAsyncThunk(
  "recurringExpenses/add",
  async (rule: RecurringExpense, { rejectWithValue }) => {
    try {
      await recurringExpenseStorage.addRule(rule);
      return rule;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to add"
      );
    }
  }
);

export const updateRecurringExpense = createAsyncThunk(
  "recurringExpenses/update",
  async (
    { id, data }: { id: string; data: Partial<RecurringExpense> },
    { rejectWithValue }
  ) => {
    try {
      await recurringExpenseStorage.updateRule(id, data);
      return { id, data };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to update"
      );
    }
  }
);

export const deleteRecurringExpense = createAsyncThunk(
  "recurringExpenses/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await recurringExpenseStorage.deleteRule(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to delete"
      );
    }
  }
);

/**
 * Generate any due expenses from the recurring rules, persist both the new
 * expenses and the advanced rules, then refresh the expense list (which also
 * recalculates budgets).
 *
 * Returns the number of generated expenses.
 */
export const processRecurringExpenses = createAsyncThunk(
  "recurringExpenses/process",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const rules = await recurringExpenseStorage.loadRules();
      const { newExpenses, updatedRules, generatedCount } =
        generateExpensesFromRules(rules);

      if (generatedCount === 0) {
        return { rules, generatedCount: 0 };
      }

      // Persist generated expenses.
      const existing = await expenseStorage.loadExpenses();
      await expenseStorage.saveExpenses([...existing, ...newExpenses]);

      // Persist advanced rules.
      await recurringExpenseStorage.saveRules(updatedRules);

      // Refresh expenses in the store (also triggers budget recalculation).
      await dispatch(loadExpenses());

      return { rules: updatedRules, generatedCount };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to process"
      );
    }
  }
);

const recurringExpenseSlice = createSlice({
  name: "recurringExpenses",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadRecurringExpenses.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loadRecurringExpenses.fulfilled, (state, action) => {
      state.loading = false;
      state.rules = action.payload;
    });
    builder.addCase(loadRecurringExpenses.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    builder.addCase(addRecurringExpense.fulfilled, (state, action) => {
      state.rules.push(action.payload);
    });

    builder.addCase(updateRecurringExpense.fulfilled, (state, action) => {
      const { id, data } = action.payload;
      const index = state.rules.findIndex((r) => r.id === id);
      if (index !== -1) {
        state.rules[index] = {
          ...state.rules[index],
          ...data,
          updatedAt: new Date().toISOString(),
        };
      }
    });

    builder.addCase(deleteRecurringExpense.fulfilled, (state, action) => {
      state.rules = state.rules.filter((r) => r.id !== action.payload);
    });

    builder.addCase(processRecurringExpenses.fulfilled, (state, action) => {
      // Keep rule state in sync with the advanced lastGeneratedDate values.
      state.rules = action.payload.rules as RecurringExpense[];
    });
  },
});

export const { clearError } = recurringExpenseSlice.actions;
export default recurringExpenseSlice.reducer;

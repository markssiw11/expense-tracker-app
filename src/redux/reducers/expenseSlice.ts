import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Expense, ExpenseCategory } from "../../types";
import expenseStorage from "../../services/storage/expenseStorage";
import { getCurrentMonth } from "../../utils/expenseUtils";

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
  async (_, { rejectWithValue }) => {
    try {
      const expenses = await expenseStorage.loadExpenses();
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
  async (expense: Expense, { rejectWithValue }) => {
    try {
      await expenseStorage.addExpense(expense);
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
    { rejectWithValue }
  ) => {
    try {
      await expenseStorage.updateExpense(id, data);
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
  async (id: string, { rejectWithValue }) => {
    try {
      await expenseStorage.deleteExpense(id);
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

import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  createSelector,
} from "@reduxjs/toolkit";
import {
  SpendingLimit,
  BudgetStatus,
  SpendingLimitConfig,
  BudgetPeriodType,
} from "../../types";
import spendingLimitStorage from "../../services/storage/spendingLimitStorage";
import { calculateBudgetStatus } from "../../utils/budgetCalculator";
import { RootState } from "../store";

interface SpendingLimitState {
  config: SpendingLimitConfig;
  budgetStatus: {
    weekly: BudgetStatus | null;
    monthly: BudgetStatus | null;
  };
  loading: boolean;
  error: string | null;
}

const initialState: SpendingLimitState = {
  config: {
    weekly: null,
    monthly: null,
  },
  budgetStatus: {
    weekly: null,
    monthly: null,
  },
  loading: false,
  error: null,
};

// Async thunks
export const loadConfig = createAsyncThunk(
  "spendingLimit/loadConfig",
  async (_, { rejectWithValue }) => {
    try {
      const config = await spendingLimitStorage.loadConfig();
      return config;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to load spending limit configuration"
      );
    }
  }
);

export const saveLimit = createAsyncThunk(
  "spendingLimit/saveLimit",
  async (
    { periodType, amount }: { periodType: BudgetPeriodType; amount: number },
    { rejectWithValue }
  ) => {
    try {
      const limit: SpendingLimit = {
        id: `${periodType}-${Date.now()}`,
        periodType,
        amount,
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await spendingLimitStorage.updateLimit(periodType, limit);
      return limit;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to save spending limit"
      );
    }
  }
);

export const updateLimit = createAsyncThunk(
  "spendingLimit/updateLimit",
  async (
    {
      periodType,
      amount,
      enabled,
    }: { periodType: BudgetPeriodType; amount?: number; enabled?: boolean },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const currentLimit =
        periodType === BudgetPeriodType.WEEKLY
          ? state.spendingLimit.config.weekly
          : state.spendingLimit.config.monthly;

      if (!currentLimit) {
        throw new Error("No existing limit to update");
      }

      const updatedLimit: SpendingLimit = {
        ...currentLimit,
        amount: amount !== undefined ? amount : currentLimit.amount,
        enabled: enabled !== undefined ? enabled : currentLimit.enabled,
        updatedAt: new Date().toISOString(),
      };

      await spendingLimitStorage.updateLimit(periodType, updatedLimit);
      return updatedLimit;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to update spending limit"
      );
    }
  }
);

export const deleteLimit = createAsyncThunk(
  "spendingLimit/deleteLimit",
  async (periodType: BudgetPeriodType, { rejectWithValue }) => {
    try {
      await spendingLimitStorage.deleteLimit(periodType);
      return periodType;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to delete spending limit"
      );
    }
  }
);

export const toggleLimit = createAsyncThunk(
  "spendingLimit/toggleLimit",
  async (periodType: BudgetPeriodType, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const currentLimit =
        periodType === BudgetPeriodType.WEEKLY
          ? state.spendingLimit.config.weekly
          : state.spendingLimit.config.monthly;

      if (!currentLimit) {
        throw new Error("No limit to toggle");
      }

      const updatedLimit: SpendingLimit = {
        ...currentLimit,
        enabled: !currentLimit.enabled,
        updatedAt: new Date().toISOString(),
      };

      await spendingLimitStorage.updateLimit(periodType, updatedLimit);
      return updatedLimit;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to toggle spending limit"
      );
    }
  }
);

const spendingLimitSlice = createSlice({
  name: "spendingLimit",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateBudgetStatus: (
      state,
      action: PayloadAction<{
        weekly: BudgetStatus | null;
        monthly: BudgetStatus | null;
      }>
    ) => {
      state.budgetStatus = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Load config
    builder.addCase(loadConfig.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loadConfig.fulfilled, (state, action) => {
      state.loading = false;
      state.config = action.payload;
    });
    builder.addCase(loadConfig.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Save limit
    builder.addCase(saveLimit.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(saveLimit.fulfilled, (state, action) => {
      state.loading = false;
      const limit = action.payload;
      if (limit.periodType === BudgetPeriodType.WEEKLY) {
        state.config.weekly = limit;
      } else {
        state.config.monthly = limit;
      }
    });
    builder.addCase(saveLimit.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update limit
    builder.addCase(updateLimit.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateLimit.fulfilled, (state, action) => {
      state.loading = false;
      const limit = action.payload;
      if (limit.periodType === BudgetPeriodType.WEEKLY) {
        state.config.weekly = limit;
      } else {
        state.config.monthly = limit;
      }
    });
    builder.addCase(updateLimit.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete limit
    builder.addCase(deleteLimit.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteLimit.fulfilled, (state, action) => {
      state.loading = false;
      const periodType = action.payload;
      if (periodType === BudgetPeriodType.WEEKLY) {
        state.config.weekly = null;
        state.budgetStatus.weekly = null;
      } else {
        state.config.monthly = null;
        state.budgetStatus.monthly = null;
      }
    });
    builder.addCase(deleteLimit.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Toggle limit
    builder.addCase(toggleLimit.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(toggleLimit.fulfilled, (state, action) => {
      state.loading = false;
      const limit = action.payload;
      if (limit.periodType === BudgetPeriodType.WEEKLY) {
        state.config.weekly = limit;
      } else {
        state.config.monthly = limit;
      }
    });
    builder.addCase(toggleLimit.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

// Selectors
export const selectSpendingLimitConfig = (state: RootState) =>
  state.spendingLimit.config;

export const selectWeeklyLimit = (state: RootState) =>
  state.spendingLimit.config.weekly;

export const selectMonthlyLimit = (state: RootState) =>
  state.spendingLimit.config.monthly;

export const selectSpendingLimitLoading = (state: RootState) =>
  state.spendingLimit.loading;

export const selectSpendingLimitError = (state: RootState) =>
  state.spendingLimit.error;

// Memoized selector for budget status calculation
export const selectBudgetStatus = createSelector(
  [
    (state: RootState) => state.expenses.expenses,
    (state: RootState) => state.spendingLimit.config,
  ],
  (expenses, config) => {
    const budgetStatus: {
      weekly: BudgetStatus | null;
      monthly: BudgetStatus | null;
    } = {
      weekly: null,
      monthly: null,
    };

    // Calculate weekly budget status if limit is configured and enabled
    if (config.weekly && config.weekly.enabled) {
      budgetStatus.weekly = calculateBudgetStatus(
        expenses,
        config.weekly,
        BudgetPeriodType.WEEKLY
      );
    }

    // Calculate monthly budget status if limit is configured and enabled
    if (config.monthly && config.monthly.enabled) {
      budgetStatus.monthly = calculateBudgetStatus(
        expenses,
        config.monthly,
        BudgetPeriodType.MONTHLY
      );
    }

    return budgetStatus;
  }
);

// Memoized selector for weekly budget status
export const selectWeeklyBudgetStatus = createSelector(
  [selectBudgetStatus],
  (budgetStatus) => budgetStatus.weekly
);

// Memoized selector for monthly budget status
export const selectMonthlyBudgetStatus = createSelector(
  [selectBudgetStatus],
  (budgetStatus) => budgetStatus.monthly
);

export const { clearError, updateBudgetStatus } = spendingLimitSlice.actions;
export default spendingLimitSlice.reducer;

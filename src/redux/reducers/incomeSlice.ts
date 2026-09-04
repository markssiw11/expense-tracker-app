import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import incomeStorage from "../../services/storage/incomeStorage";
import { Income } from "../../types/income.types";
import { getCurrentMonth } from "../../utils/expenseUtils";

interface IncomeState {
  incomes: Income[];
  loading: boolean;
  error: string | null;
  selectedMonth: string;
}

const initialState: IncomeState = {
  incomes: [],
  loading: false,
  error: null,
  selectedMonth: getCurrentMonth(),
};

export const loadIncomes = createAsyncThunk(
  "incomes/load",
  async (_, { rejectWithValue }) => {
    try {
      return await incomeStorage.loadIncomes();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to load incomes"
      );
    }
  }
);

export const addIncome = createAsyncThunk(
  "incomes/add",
  async (income: Income, { rejectWithValue }) => {
    try {
      await incomeStorage.addIncome(income);
      return income;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to add income"
      );
    }
  }
);

export const updateIncome = createAsyncThunk(
  "incomes/update",
  async (
    { id, data }: { id: string; data: Partial<Income> },
    { rejectWithValue }
  ) => {
    try {
      await incomeStorage.updateIncome(id, data);
      return { id, data };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to update income"
      );
    }
  }
);

export const deleteIncome = createAsyncThunk(
  "incomes/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await incomeStorage.deleteIncome(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to delete income"
      );
    }
  }
);

const incomeSlice = createSlice({
  name: "incomes",
  initialState,
  reducers: {
    setIncomeSelectedMonth: (state, action: PayloadAction<string>) => {
      state.selectedMonth = action.payload;
    },
    clearIncomeError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadIncomes.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loadIncomes.fulfilled, (state, action) => {
      state.loading = false;
      state.incomes = action.payload;
    });
    builder.addCase(loadIncomes.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    builder.addCase(addIncome.fulfilled, (state, action) => {
      state.incomes.push(action.payload);
    });

    builder.addCase(updateIncome.fulfilled, (state, action) => {
      const { id, data } = action.payload;
      const index = state.incomes.findIndex((e) => e.id === id);
      if (index !== -1) {
        state.incomes[index] = {
          ...state.incomes[index],
          ...data,
          updatedAt: new Date().toISOString(),
        };
      }
    });

    builder.addCase(deleteIncome.fulfilled, (state, action) => {
      state.incomes = state.incomes.filter((e) => e.id !== action.payload);
    });
  },
});

export const { setIncomeSelectedMonth, clearIncomeError } =
  incomeSlice.actions;
export default incomeSlice.reducer;

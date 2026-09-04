import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import authReducer from "./reducers/authSlice";
import eventReducer from "./reducers/eventSlice";
import expenseReducer from "./reducers/expenseSlice";
import familyReducer from "./reducers/familySlice";
import noteReducer from "./reducers/noteSlice";
import recurringExpenseReducer from "./reducers/recurringExpenseSlice";
import spendingLimitReducer from "./reducers/spendingLimitSlice";

export const store = configureStore({
  reducer: {
    expenses: expenseReducer,
    notes: noteReducer,
    family: familyReducer,
    auth: authReducer,
    events: eventReducer,
    spendingLimit: spendingLimitReducer,
    recurringExpenses: recurringExpenseReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export typed hooks for use throughout the app
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

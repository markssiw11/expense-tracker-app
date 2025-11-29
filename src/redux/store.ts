import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import expenseReducer from "./reducers/expenseSlice";
import noteReducer from "./reducers/noteSlice";
import familyReducer from "./reducers/familySlice";
import authReducer from "./reducers/authSlice";
import eventReducer from "./reducers/eventSlice";
import spendingLimitReducer from "./reducers/spendingLimitSlice";

export const store = configureStore({
  reducer: {
    expenses: expenseReducer,
    notes: noteReducer,
    family: familyReducer,
    auth: authReducer,
    events: eventReducer,
    spendingLimit: spendingLimitReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export typed hooks for use throughout the app
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

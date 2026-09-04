// Export store and hooks
export { store, useAppDispatch, useAppSelector } from "./store";
export type { AppDispatch, RootState } from "./store";

// Export expense actions
export {
  addExpense,
  clearError,
  deleteExpense,
  loadExpenses,
  setFilters,
  setSelectedMonth,
  updateExpense,
} from "./reducers/expenseSlice";

// Export note actions
export {
  addNote,
  clearNoteError,
  deleteNote,
  loadNotes,
  setNoteFilters,
  setSearchQuery,
  setSortBy,
  togglePinNote,
  updateNote,
} from "./reducers/noteSlice";

// Export family actions
export {
  addMember,
  deleteMember,
  loadFamilyMembers,
  saveFamilyMembers,
  updateMember,
} from "./reducers/familySlice";
export type { FamilyMember } from "./reducers/familySlice";

// Export recurring expense actions
export {
  addRecurringExpense,
  clearError as clearRecurringExpenseError,
  deleteRecurringExpense,
  loadRecurringExpenses,
  processRecurringExpenses,
  updateRecurringExpense,
} from "./reducers/recurringExpenseSlice";

// Export spending limit actions
export {
  clearError as clearSpendingLimitError,
  deleteLimit,
  loadConfig,
  saveLimit,
  selectBudgetStatus,
  selectMonthlyBudgetStatus,
  selectMonthlyLimit,
  selectSpendingLimitConfig,
  selectSpendingLimitError,
  selectSpendingLimitLoading,
  selectWeeklyBudgetStatus,
  selectWeeklyLimit,
  toggleLimit,
  updateBudgetStatus,
  updateLimit,
} from "./reducers/spendingLimitSlice";

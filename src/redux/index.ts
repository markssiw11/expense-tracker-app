// Export store and hooks
export { store, useAppDispatch, useAppSelector } from "./store";
export type { RootState, AppDispatch } from "./store";

// Export expense actions
export {
  loadExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  setSelectedMonth,
  setFilters,
  clearError,
} from "./reducers/expenseSlice";

// Export note actions
export {
  loadNotes,
  addNote,
  updateNote,
  deleteNote,
  setSearchQuery,
  setNoteFilters,
  setSortBy,
  togglePinNote,
  clearNoteError,
} from "./reducers/noteSlice";

// Export family actions
export {
  loadFamilyMembers,
  saveFamilyMembers,
  addMember,
  updateMember,
  deleteMember,
} from "./reducers/familySlice";
export type { FamilyMember } from "./reducers/familySlice";

// Export spending limit actions
export {
  loadConfig,
  saveLimit,
  updateLimit,
  deleteLimit,
  toggleLimit,
  clearError as clearSpendingLimitError,
  updateBudgetStatus,
  selectSpendingLimitConfig,
  selectWeeklyLimit,
  selectMonthlyLimit,
  selectSpendingLimitLoading,
  selectSpendingLimitError,
  selectBudgetStatus,
  selectWeeklyBudgetStatus,
  selectMonthlyBudgetStatus,
} from "./reducers/spendingLimitSlice";

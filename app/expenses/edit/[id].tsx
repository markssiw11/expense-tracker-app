import ExpenseForm from "@/src/components/ExpenseForm";
import { useExpenseForm } from "@/src/hooks/useExpenseForm";
import { useTranslation } from "@/src/hooks/useTranslation";
import {
  deleteExpense,
  loadFamilyMembers,
  selectMonthlyBudgetStatus,
  selectWeeklyBudgetStatus,
  updateExpense,
} from "@/src/redux";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { Expense } from "@/src/types/expense.types";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { Alert } from "react-native";

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const expense = useAppSelector((state) =>
    state.expenses.expenses.find((exp) => exp.id === id),
  );
  const familyMembers = useAppSelector((state) => state.family.members);
  const weeklyBudgetStatus = useAppSelector(selectWeeklyBudgetStatus);
  const monthlyBudgetStatus = useAppSelector(selectMonthlyBudgetStatus);

  const {
    amount,
    setAmount,
    category,
    setCategory,
    spender,
    setSpender,
    date,
    setDate,
    note,
    setNote,
    showDatePicker,
    setShowDatePicker,
    errors,
    validateForm,
    clearError,
  } = useExpenseForm();

  useEffect(() => {
    dispatch(loadFamilyMembers());
  }, [dispatch]);

  // Pre-fill form with existing expense data
  useEffect(() => {
    if (expense) {
      setAmount(expense.amount.toString());
      setCategory(expense.category);
      setSpender(expense.spender || null);
      setDate(new Date(expense.date));
      setNote(expense.note || "");
    }
  }, [expense, setAmount, setCategory, setSpender, setDate, setNote]);

  // If expense not found, go back
  useEffect(() => {
    if (!expense && id) {
      Alert.alert(t("common.error"), t("expenses.expenseNotFound"));
      router.back();
    }
  }, [expense, id]);

  const handleSave = async () => {
    if (!validateForm(t) || !expense) {
      return;
    }

    const updatedData: Partial<Expense> = {
      amount: parseFloat(amount),
      category: category!,
      spender: spender || undefined,
      date: date.toISOString(),
      note: note.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    try {
      await dispatch(
        updateExpense({ id: expense.id, data: updatedData }),
      ).unwrap();
      Alert.alert(t("common.success"), t("expenses.updateExpenseSuccess"));
      router.back();
    } catch {
      Alert.alert(t("common.error"), t("expenses.updateExpenseFailed"));
    }
  };

  const handleDelete = () => {
    Alert.alert(t("common.confirmDelete"), t("expenses.deleteConfirm"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          if (!expense) return;
          try {
            await dispatch(deleteExpense(expense.id)).unwrap();
            Alert.alert(
              t("common.success"),
              t("expenses.deleteExpenseSuccess"),
            );
            router.back();
          } catch {
            Alert.alert(t("common.error"), t("expenses.deleteExpenseFailed"));
          }
        },
      },
    ]);
  };

  if (!expense) {
    return null;
  }

  return (
    <ExpenseForm
      amount={amount}
      setAmount={setAmount}
      category={category}
      setCategory={setCategory}
      spender={spender}
      setSpender={setSpender}
      date={date}
      setDate={setDate}
      note={note}
      setNote={setNote}
      showDatePicker={showDatePicker}
      setShowDatePicker={setShowDatePicker}
      errors={errors}
      clearError={clearError}
      familyMembers={familyMembers}
      onCancel={() => router.back()}
      onSave={handleSave}
      onDelete={handleDelete}
      weeklyBudgetStatus={weeklyBudgetStatus}
      monthlyBudgetStatus={monthlyBudgetStatus}
      existingExpenseAmount={expense?.amount || 0}
    />
  );
}

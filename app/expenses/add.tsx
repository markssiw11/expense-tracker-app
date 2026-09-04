import CustomHeader from "@/src/components/CustomHeader";
import ExpenseForm from "@/src/components/ExpenseForm";
import { useExpenseForm } from "@/src/hooks/useExpenseForm";
import { useTranslation } from "@/src/hooks/useTranslation";
import {
  addExpense,
  loadFamilyMembers,
  selectMonthlyBudgetStatus,
  selectWeeklyBudgetStatus,
} from "@/src/redux";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { Expense } from "@/src/types";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Alert, View } from "react-native";

export default function AddExpenseScreen() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
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

  const handleSave = async () => {
    if (!validateForm(t)) {
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
      amount: parseFloat(amount),
      category: category!,
      date: date.toISOString(),
      note: note.trim() || undefined,
      spender: spender || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await dispatch(addExpense(newExpense)).unwrap();
      Alert.alert(t("common.success"), t("expenses.addExpenseSuccess"));
      router.back();
    } catch {
      Alert.alert(t("common.error"), t("expenses.addExpenseFailed"));
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <CustomHeader title={t("expenses.addExpense")} />
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
        weeklyBudgetStatus={weeklyBudgetStatus}
        monthlyBudgetStatus={monthlyBudgetStatus}
        existingExpenseAmount={0}
      />
    </View>
  );
}

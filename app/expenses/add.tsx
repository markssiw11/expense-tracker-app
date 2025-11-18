import React, { useEffect } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { addExpense, loadFamilyMembers } from "@/src/redux";
import { Expense } from "@/src/types";
import { useExpenseForm } from "@/src/hooks/useExpenseForm";
import ExpenseForm from "@/src/components/ExpenseForm";

export default function AddExpenseScreen() {
  const dispatch = useAppDispatch();
  const familyMembers = useAppSelector((state) => state.family.members);

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
    if (!validateForm()) {
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
      Alert.alert("Thành công", "Đã thêm chi phí mới");
      router.back();
    } catch {
      Alert.alert("Lỗi", "Không thể thêm chi phí. Vui lòng thử lại.");
    }
  };

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
    />
  );
}

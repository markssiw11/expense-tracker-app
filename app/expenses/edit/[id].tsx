import React, { useEffect } from "react";
import { Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { updateExpense, deleteExpense, loadFamilyMembers } from "@/src/redux";
import { Expense } from "@/src/types/expense.types";
import { useExpenseForm } from "@/src/hooks/useExpenseForm";
import ExpenseForm from "@/src/components/ExpenseForm";

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const expense = useAppSelector((state) =>
    state.expenses.expenses.find((exp) => exp.id === id)
  );
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
      Alert.alert("Lỗi", "Không tìm thấy chi phí");
      router.back();
    }
  }, [expense, id]);

  const handleSave = async () => {
    if (!validateForm() || !expense) {
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
        updateExpense({ id: expense.id, data: updatedData })
      ).unwrap();
      Alert.alert("Thành công", "Đã cập nhật chi phí");
      router.back();
    } catch {
      Alert.alert("Lỗi", "Không thể cập nhật chi phí. Vui lòng thử lại.");
    }
  };

  const handleDelete = () => {
    Alert.alert("Xác nhận xóa", "Bạn có chắc chắn muốn xóa chi phí này?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          if (!expense) return;
          try {
            await dispatch(deleteExpense(expense.id)).unwrap();
            Alert.alert("Thành công", "Đã xóa chi phí");
            router.back();
          } catch {
            Alert.alert("Lỗi", "Không thể xóa chi phí. Vui lòng thử lại.");
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
    />
  );
}

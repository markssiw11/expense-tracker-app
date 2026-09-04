import { ExpenseCategory } from "@/src/types";
import { useState } from "react";

interface FormErrors {
  amount?: string;
  category?: string;
  note?: string;
}

export function useExpenseForm(initialData?: {
  amount?: string;
  category?: ExpenseCategory | null;
  spender?: string | null;
  date?: Date;
  note?: string;
}) {
  const [amount, setAmount] = useState(initialData?.amount || "");
  const [category, setCategory] = useState<ExpenseCategory | null>(
    initialData?.category || null,
  );
  const [spender, setSpender] = useState<string | null>(
    initialData?.spender || null,
  );
  const [date, setDate] = useState(initialData?.date || new Date());
  const [note, setNote] = useState(initialData?.note || "");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (t?: (key: string) => string) => {
    const translate = t ?? ((key: string) => key);
    const newErrors: FormErrors = {};

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = translate("expenses.amountRequired");
    }

    if (!category) {
      newErrors.category = translate("expenses.categoryRequired");
    }

    if (note.length > 200) {
      newErrors.note = translate("expenses.noteTooLong");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const resetForm = () => {
    setAmount("");
    setCategory(null);
    setSpender(null);
    setDate(new Date());
    setNote("");
    setErrors({});
  };

  return {
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
    resetForm,
  };
}

import { loadCustomExpenseCategories } from "@/src/services/expenseCategoryStorage";
import { CustomExpenseCategory } from "@/src/types/expense.types";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

export function useCustomExpenseCategories() {
  const [categories, setCategories] = useState<CustomExpenseCategory[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadCustomExpenseCategories()
        .then((loadedCategories) => {
          if (active) setCategories(loadedCategories);
        })
        .catch(() => {
          if (active) setCategories([]);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  return categories;
}

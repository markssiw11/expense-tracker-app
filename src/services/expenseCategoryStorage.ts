import AsyncStorage from "@react-native-async-storage/async-storage";
import { CustomExpenseCategory } from "../types/expense.types";

export const CUSTOM_EXPENSE_CATEGORIES_KEY =
  "@expense_tracker:custom_categories";

export async function loadCustomExpenseCategories(): Promise<
  CustomExpenseCategory[]
> {
  const stored = await AsyncStorage.getItem(CUSTOM_EXPENSE_CATEGORIES_KEY);
  if (!stored) return [];

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CustomExpenseCategory =>
        item &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.icon === "string" &&
        typeof item.color === "string",
    );
  } catch {
    return [];
  }
}

export async function addCustomExpenseCategory(
  name: string,
  icon: string,
  color: string,
): Promise<CustomExpenseCategory> {
  const normalizedName = name.trim();
  if (!normalizedName) throw new Error("Category name is required");

  const categories = await loadCustomExpenseCategories();
  if (
    categories.some(
      (category) =>
        category.name.toLocaleLowerCase() ===
        normalizedName.toLocaleLowerCase(),
    )
  ) {
    throw new Error("Category already exists");
  }

  const category: CustomExpenseCategory = {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: normalizedName,
    icon,
    color,
  };
  await AsyncStorage.setItem(
    CUSTOM_EXPENSE_CATEGORIES_KEY,
    JSON.stringify([...categories, category]),
  );
  return category;
}

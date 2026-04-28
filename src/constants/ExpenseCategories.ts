import { CategoryConfig, ExpenseCategory } from "../types";

export const EXPENSE_CATEGORIES_BASE: Omit<CategoryConfig, "label">[] = [
  {
    key: ExpenseCategory.FOOD,
    icon: "restaurant",
    color: "#FF6B6B",
  },
  {
    key: ExpenseCategory.TRANSPORTATION,
    icon: "car",
    color: "#4ECDC4",
  },
  {
    key: ExpenseCategory.ENTERTAINMENT,
    icon: "game-controller",
    color: "#95E1D3",
  },
  {
    key: ExpenseCategory.SHOPPING,
    icon: "cart",
    color: "#F38181",
  },
  {
    key: ExpenseCategory.BILLS,
    icon: "receipt",
    color: "#AA96DA",
  },
  {
    key: ExpenseCategory.HEALTHCARE,
    icon: "medical",
    color: "#FCBAD3",
  },
  {
    key: ExpenseCategory.EDUCATION,
    icon: "school",
    color: "#A8D8EA",
  },
  {
    key: ExpenseCategory.OTHER,
    icon: "ellipsis-horizontal",
    color: "#C7CEEA",
  },
];

// Function to get categories with translated labels
export const getExpenseCategories = (
  t: (key: string) => string
): CategoryConfig[] => {
  return EXPENSE_CATEGORIES_BASE.map((category) => ({
    ...category,
    label: t(`categories.${category.key.toLowerCase()}`),
  }));
};

export const getCategoryConfig = (
  category: ExpenseCategory,
  t: (key: string) => string
): CategoryConfig => {
  const categories = getExpenseCategories(t);
  return (
    categories.find((c) => c.key === category) ||
    categories[categories.length - 1]
  );
};

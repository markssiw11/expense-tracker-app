import { ExpenseCategory, CategoryConfig } from "../types";

export const EXPENSE_CATEGORIES: CategoryConfig[] = [
  {
    key: ExpenseCategory.FOOD,
    label: "Ăn uống",
    icon: "restaurant",
    color: "#FF6B6B",
  },
  {
    key: ExpenseCategory.TRANSPORTATION,
    label: "Đi lại",
    icon: "car",
    color: "#4ECDC4",
  },
  {
    key: ExpenseCategory.ENTERTAINMENT,
    label: "Giải trí",
    icon: "game-controller",
    color: "#95E1D3",
  },
  {
    key: ExpenseCategory.SHOPPING,
    label: "Mua sắm",
    icon: "cart",
    color: "#F38181",
  },
  {
    key: ExpenseCategory.BILLS,
    label: "Hóa đơn",
    icon: "receipt",
    color: "#AA96DA",
  },
  {
    key: ExpenseCategory.HEALTHCARE,
    label: "Y tế",
    icon: "medical",
    color: "#FCBAD3",
  },
  {
    key: ExpenseCategory.EDUCATION,
    label: "Giáo dục",
    icon: "school",
    color: "#A8D8EA",
  },
  {
    key: ExpenseCategory.OTHER,
    label: "Khác",
    icon: "ellipsis-horizontal",
    color: "#C7CEEA",
  },
];

export const getCategoryConfig = (
  category: ExpenseCategory
): CategoryConfig => {
  return (
    EXPENSE_CATEGORIES.find((c) => c.key === category) ||
    EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]
  );
};

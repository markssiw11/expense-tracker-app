import { IncomeCategory, IncomeCategoryConfig } from "../types/income.types";

export const INCOME_CATEGORIES_BASE: Omit<IncomeCategoryConfig, "label">[] = [
  { key: IncomeCategory.SALARY, icon: "cash", color: "#10B981" },
  { key: IncomeCategory.BONUS, icon: "gift", color: "#F59E0B" },
  { key: IncomeCategory.INVESTMENT, icon: "trending-up", color: "#3B82F6" },
  { key: IncomeCategory.BUSINESS, icon: "briefcase", color: "#8B5CF6" },
  { key: IncomeCategory.GIFT, icon: "heart", color: "#EC4899" },
  { key: IncomeCategory.OTHER, icon: "ellipsis-horizontal", color: "#6B7280" },
];

export const getIncomeCategories = (
  t: (key: string) => string
): IncomeCategoryConfig[] => {
  return INCOME_CATEGORIES_BASE.map((category) => ({
    ...category,
    label: t(`incomeCategories.${category.key}`),
  }));
};

export const getIncomeCategoryConfig = (
  category: IncomeCategory,
  t: (key: string) => string
): IncomeCategoryConfig => {
  const categories = getIncomeCategories(t);
  return (
    categories.find((c) => c.key === category) ||
    categories[categories.length - 1]
  );
};

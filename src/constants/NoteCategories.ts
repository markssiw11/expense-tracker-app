import { NoteCategory, NoteCategoryConfig } from "../types";

export const NOTE_CATEGORIES_BASE: Omit<NoteCategoryConfig, "label">[] = [
  {
    key: NoteCategory.GOLD_PRICE,
    icon: "logo-bitcoin",
    color: "#FFD700",
  },
  {
    key: NoteCategory.INVESTMENT,
    icon: "trending-up",
    color: "#4CAF50",
  },
  {
    key: NoteCategory.IMPORTANT_INFO,
    icon: "alert-circle",
    color: "#FF5722",
  },
  {
    key: NoteCategory.SHOPPING,
    icon: "cart",
    color: "#E91E63",
  },
  {
    key: NoteCategory.PERSONAL,
    icon: "person",
    color: "#9C27B0",
  },
  {
    key: NoteCategory.WORK,
    icon: "briefcase",
    color: "#2196F3",
  },
  {
    key: NoteCategory.OTHER,
    icon: "ellipsis-horizontal",
    color: "#607D8B",
  },
];

// Function to get categories with translated labels
export const getNoteCategories = (
  t: (key: string) => string
): NoteCategoryConfig[] => {
  return NOTE_CATEGORIES_BASE.map((category) => ({
    ...category,
    label: t(`noteCategories.${category.key.toLowerCase()}`),
  }));
};

export const getNoteCategoryConfig = (
  category: NoteCategory,
  t: (key: string) => string
): NoteCategoryConfig => {
  const categories = getNoteCategories(t);
  return (
    categories.find((c) => c.key === category) ||
    categories[categories.length - 1]
  );
};

// Legacy export for backward compatibility
export const NOTE_CATEGORIES = NOTE_CATEGORIES_BASE.map((category) => ({
  ...category,
  label: category.key, // Fallback to key if no translation
}));

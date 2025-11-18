import { NoteCategory, NoteCategoryConfig } from "../types";

export const NOTE_CATEGORIES: NoteCategoryConfig[] = [
  {
    key: NoteCategory.GOLD_PRICE,
    label: "Giá vàng",
    icon: "logo-bitcoin",
    color: "#FFD700",
  },
  {
    key: NoteCategory.INVESTMENT,
    label: "Đầu tư",
    icon: "trending-up",
    color: "#4CAF50",
  },
  {
    key: NoteCategory.IMPORTANT_INFO,
    label: "Thông tin quan trọng",
    icon: "alert-circle",
    color: "#FF5722",
  },
  {
    key: NoteCategory.SHOPPING,
    label: "Mua sắm",
    icon: "cart",
    color: "#E91E63",
  },
  {
    key: NoteCategory.PERSONAL,
    label: "Cá nhân",
    icon: "person",
    color: "#9C27B0",
  },
  {
    key: NoteCategory.WORK,
    label: "Công việc",
    icon: "briefcase",
    color: "#2196F3",
  },
  {
    key: NoteCategory.OTHER,
    label: "Khác",
    icon: "ellipsis-horizontal",
    color: "#607D8B",
  },
];

export const getNoteCategoryConfig = (
  category: NoteCategory
): NoteCategoryConfig => {
  return (
    NOTE_CATEGORIES.find((c) => c.key === category) ||
    NOTE_CATEGORIES[NOTE_CATEGORIES.length - 1]
  );
};

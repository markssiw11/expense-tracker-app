// Note Types and Interfaces

export enum NoteCategory {
  GOLD_PRICE = "gold_price",
  INVESTMENT = "investment",
  IMPORTANT_INFO = "important_info",
  SHOPPING = "shopping",
  PERSONAL = "personal",
  WORK = "work",
  OTHER = "other",
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  tags?: string[];
  date: string; // ISO date string
  amount?: number;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
}

export interface NoteCategoryConfig {
  key: NoteCategory;
  label: string;
  icon: string;
  color: string;
}

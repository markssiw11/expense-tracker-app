import { compareDesc, parseISO } from "date-fns";
import { Note, NoteCategory } from "../types";

export type NoteSortBy = "date" | "title" | "updatedAt";

/**
 * Filter notes by search query (title, content, tags)
 * @param notes - Array of notes
 * @param query - Search query string
 * @returns Filtered notes
 */
export const filterNotesByQuery = (notes: Note[], query: string): Note[] => {
  if (!query.trim()) {
    return notes;
  }

  const lowerQuery = query.toLowerCase();

  return notes.filter((note) => {
    const titleMatch = note.title.toLowerCase().includes(lowerQuery);
    const contentMatch = note.content.toLowerCase().includes(lowerQuery);
    const tagsMatch =
      note.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)) || false;

    return titleMatch || contentMatch || tagsMatch;
  });
};

/**
 * Filter notes by categories
 * @param notes - Array of notes
 * @param categories - Array of categories to filter by
 * @returns Filtered notes
 */
export const filterNotesByCategories = (
  notes: Note[],
  categories: NoteCategory[],
): Note[] => {
  if (categories.length === 0) {
    return notes;
  }

  return notes.filter((note) => categories.includes(note.category));
};

/**
 * Filter notes by tags
 * @param notes - Array of notes
 * @param tags - Array of tags to filter by
 * @returns Filtered notes
 */
export const filterNotesByTags = (notes: Note[], tags: string[]): Note[] => {
  if (tags.length === 0) {
    return notes;
  }

  return notes.filter((note) => {
    if (!note.tags || note.tags.length === 0) {
      return false;
    }
    return tags.some((tag) => note.tags?.includes(tag));
  });
};

/**
 * Sort notes by specified field
 * @param notes - Array of notes
 * @param sortBy - Field to sort by
 * @returns Sorted notes
 */
export const sortNotes = (notes: Note[], sortBy: NoteSortBy): Note[] => {
  const sortedNotes = [...notes];

  switch (sortBy) {
    case "date":
      return sortedNotes.sort((a, b) => {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        return compareDesc(dateA, dateB); // Most recent first
      });

    case "title":
      return sortedNotes.sort((a, b) => {
        return a.title.localeCompare(b.title, "vi");
      });

    case "updatedAt":
      return sortedNotes.sort((a, b) => {
        const dateA = parseISO(a.updatedAt);
        const dateB = parseISO(b.updatedAt);
        return compareDesc(dateA, dateB); // Most recent first
      });

    default:
      return sortedNotes;
  }
};

/**
 * Separate pinned and unpinned notes
 * @param notes - Array of notes
 * @returns Object with pinned and unpinned notes arrays
 */
export const separatePinnedNotes = (
  notes: Note[],
): { pinned: Note[]; unpinned: Note[] } => {
  const pinned = notes.filter((note) => note.isPinned);
  const unpinned = notes.filter((note) => !note.isPinned);

  return { pinned, unpinned };
};

/**
 * Validate note data
 * @param note - Partial note object to validate
 * @returns Object with isValid flag and error messages
 */
export type NoteValidationField =
  | "title"
  | "content"
  | "category"
  | "amount"
  | "tags";

export interface NoteValidationError {
  field: NoteValidationField;
  // i18n key to translate at the UI layer.
  messageKey: string;
}

/**
 * Validate note data. Returns i18n message KEYS (not translated strings) so the
 * UI can display them in the active language and map them to form fields
 * without fragile string matching.
 */
export const validateNoteData = (
  note: Partial<Note>,
): { isValid: boolean; errors: NoteValidationError[] } => {
  const errors: NoteValidationError[] = [];

  // Title validation
  if (!note.title || note.title.trim().length === 0) {
    errors.push({
      field: "title",
      messageKey: "notes.validation.titleRequired",
    });
  } else if (note.title.length > 100) {
    errors.push({
      field: "title",
      messageKey: "notes.validation.titleTooLong",
    });
  }

  // Content validation
  if (!note.content || note.content.trim().length === 0) {
    errors.push({
      field: "content",
      messageKey: "notes.validation.contentRequired",
    });
  } else if (note.content.length > 2000) {
    errors.push({
      field: "content",
      messageKey: "notes.validation.contentTooLong",
    });
  }

  // Category validation
  if (!note.category) {
    errors.push({
      field: "category",
      messageKey: "notes.validation.categoryRequired",
    });
  }

  // Amount validation (if provided)
  if (note.amount !== undefined && note.amount !== null) {
    if (note.amount <= 0) {
      errors.push({
        field: "amount",
        messageKey: "notes.validation.amountPositive",
      });
    }
  }

  // Tags validation (if provided)
  if (note.tags && note.tags.length > 10) {
    errors.push({ field: "tags", messageKey: "notes.validation.tooManyTags" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get all unique tags from notes
 * @param notes - Array of notes
 * @returns Array of unique tags
 */
export const getAllTags = (notes: Note[]): string[] => {
  const tagsSet = new Set<string>();

  notes.forEach((note) => {
    if (note.tags) {
      note.tags.forEach((tag) => tagsSet.add(tag));
    }
  });

  return Array.from(tagsSet).sort();
};

/**
 * Parse tags from comma-separated string
 * @param tagsString - Comma-separated tags string
 * @returns Array of trimmed tags
 */
export const parseTagsString = (tagsString: string): string[] => {
  if (!tagsString.trim()) {
    return [];
  }

  return tagsString
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
};

/**
 * Format tags array to comma-separated string
 * @param tags - Array of tags
 * @returns Comma-separated string
 */
export const formatTagsToString = (tags: string[]): string => {
  return tags.join(", ");
};

// Event type definitions for calendar scheduling feature

export type EventCategory = "Work" | "Personal" | "Health" | "Family" | "Other";

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO 8601 format (YYYY-MM-DD)
  time: string; // HH:mm format
  location?: string;
  category: EventCategory;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface EventFormData {
  title: string;
  description: string;
  date: Date;
  time: Date;
  location: string;
  category: EventCategory;
}

export interface MarkedDates {
  [date: string]: {
    marked: boolean;
    dotColor: string;
    selected?: boolean;
    selectedColor?: string;
  };
}

// Event type definitions for calendar scheduling feature

export type EventCategory = "Work" | "Personal" | "Health" | "Family" | "Other";

export type ReminderTime = 5 | 10 | 15 | 30 | 60 | 1440; // minutes before event

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO 8601 format (YYYY-MM-DD)
  time: string; // HH:mm format
  location?: string;
  category: EventCategory;
  reminderEnabled: boolean;
  reminderMinutes: ReminderTime;
  notificationId?: string; // ID of scheduled notification
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
  reminderEnabled: boolean;
  reminderMinutes: ReminderTime;
}

export interface MarkedDates {
  [date: string]: {
    marked: boolean;
    dotColor: string;
    selected?: boolean;
    selectedColor?: string;
  };
}

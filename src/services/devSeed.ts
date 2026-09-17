import AsyncStorage from "@react-native-async-storage/async-storage";
import type { EventCategory } from "../types/event.types";
import { ExpenseCategory } from "../types/expense.types";
import { IncomeCategory } from "../types/income.types";
import { NoteCategory } from "../types/note.types";
import { BudgetPeriodType } from "../types/spendingLimit.types";

// Dev-only seeder that fills AsyncStorage with realistic, good-looking sample
// data for App Store screenshots. Not wired into production flows; call it from
// the dev-only button in Settings. Text is in English and amounts are in a
// USD-friendly range to match the default English UI.

const EXPENSES_KEY = "@expense_tracker:expenses";
const INCOMES_KEY = "@expense_tracker:incomes";
const EVENTS_KEY = "@expense_tracker:events";
const NOTES_KEY = "@expense_tracker:notes";
const SPENDING_LIMITS_KEY = "@expense_tracker:spending_limits";
const FAMILY_KEY = "@family_members";

// --- date helpers -----------------------------------------------------------

const now = new Date();
const yyyy = now.getFullYear();
const mm = now.getMonth(); // 0-indexed

/** ISO date (YYYY-MM-DD) for a given day-of-month in the current month. */
function dayOfThisMonth(day: number): string {
  const d = new Date(yyyy, mm, day, 12, 0, 0);
  return d.toISOString().split("T")[0];
}

/** Full ISO timestamp for a given day-of-month in the current month. */
function tsOfThisMonth(day: number): string {
  return new Date(yyyy, mm, day, 12, 0, 0).toISOString();
}

/** ISO date (YYYY-MM-DD) for today + offset days. */
function dayFromToday(offset: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() + offset);
  d.setHours(12, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `seed-${prefix}-${idCounter}-${Date.now().toString(36)}`;
}

// --- sample data -------------------------------------------------------------

function buildExpenses() {
  const rows: {
    amount: number;
    category: ExpenseCategory;
    day: number;
    note: string;
    spender: string;
  }[] = [
    {
      amount: 42,
      category: ExpenseCategory.FOOD,
      day: 2,
      note: "Weekend groceries",
      spender: "wife",
    },
    {
      amount: 6.5,
      category: ExpenseCategory.FOOD,
      day: 3,
      note: "Morning coffee",
      spender: "husband",
    },
    {
      amount: 58,
      category: ExpenseCategory.FOOD,
      day: 5,
      note: "Dinner at restaurant",
      spender: "shared",
    },
    {
      amount: 35,
      category: ExpenseCategory.TRANSPORTATION,
      day: 4,
      note: "Gas refill",
      spender: "husband",
    },
    {
      amount: 12,
      category: ExpenseCategory.TRANSPORTATION,
      day: 8,
      note: "Ride to work",
      spender: "wife",
    },
    {
      amount: 89,
      category: ExpenseCategory.SHOPPING,
      day: 6,
      note: "Kids clothing",
      spender: "wife",
    },
    {
      amount: 120,
      category: ExpenseCategory.BILLS,
      day: 7,
      note: "Electricity & water",
      spender: "shared",
    },
    {
      amount: 45,
      category: ExpenseCategory.BILLS,
      day: 7,
      note: "Internet & TV",
      spender: "shared",
    },
    {
      amount: 28,
      category: ExpenseCategory.ENTERTAINMENT,
      day: 9,
      note: "Movie tickets",
      spender: "shared",
    },
    {
      amount: 65,
      category: ExpenseCategory.HEALTHCARE,
      day: 11,
      note: "Routine checkup",
      spender: "husband",
    },
    {
      amount: 150,
      category: ExpenseCategory.EDUCATION,
      day: 12,
      note: "English class for kids",
      spender: "child",
    },
    {
      amount: 38,
      category: ExpenseCategory.FOOD,
      day: 14,
      note: "Supermarket run",
      spender: "wife",
    },
    {
      amount: 25,
      category: ExpenseCategory.OTHER,
      day: 15,
      note: "Birthday gift",
      spender: "shared",
    },
  ];
  return rows.map((r) => ({
    id: nextId("exp"),
    amount: r.amount,
    category: r.category,
    date: dayOfThisMonth(r.day),
    note: r.note,
    spender: r.spender,
    createdAt: tsOfThisMonth(r.day),
    updatedAt: tsOfThisMonth(r.day),
  }));
}

function buildIncomes() {
  const rows: {
    amount: number;
    category: IncomeCategory;
    day: number;
    note: string;
    earner: string;
  }[] = [
    {
      amount: 3200,
      category: IncomeCategory.SALARY,
      day: 1,
      note: "Monthly salary",
      earner: "husband",
    },
    {
      amount: 2400,
      category: IncomeCategory.SALARY,
      day: 1,
      note: "Monthly salary",
      earner: "wife",
    },
    {
      amount: 500,
      category: IncomeCategory.BONUS,
      day: 5,
      note: "Project bonus",
      earner: "husband",
    },
    {
      amount: 180,
      category: IncomeCategory.INVESTMENT,
      day: 10,
      note: "Savings interest",
      earner: "shared",
    },
  ];
  return rows.map((r) => ({
    id: nextId("inc"),
    amount: r.amount,
    category: r.category,
    date: dayOfThisMonth(r.day),
    note: r.note,
    earner: r.earner,
    createdAt: tsOfThisMonth(r.day),
    updatedAt: tsOfThisMonth(r.day),
  }));
}

function buildEvents() {
  // Offsets are relative to "today" so there is always an event on the current
  // day (offset 0), which keeps the Calendar screen populated for screenshots.
  const rows: {
    title: string;
    offset: number;
    time: string;
    category: EventCategory;
    location?: string;
    description?: string;
  }[] = [
    {
      title: "Team standup",
      offset: 0,
      time: "09:30",
      category: "Work",
      location: "Office",
      description: "Daily sync with the team",
    },
    {
      title: "Lunch with Sarah",
      offset: 0,
      time: "12:00",
      category: "Personal",
      location: "Green Cafe",
    },
    {
      title: "Yoga class",
      offset: 0,
      time: "18:00",
      category: "Health",
      location: "Zen Studio",
    },
    {
      title: "Parent-teacher meeting",
      offset: 1,
      time: "18:30",
      category: "Family",
      location: "Elementary school",
      description: "End of term meeting",
    },
    {
      title: "Dentist appointment",
      offset: 2,
      time: "09:00",
      category: "Health",
      location: "City Dental Clinic",
    },
    {
      title: "Project deadline",
      offset: 3,
      time: "17:00",
      category: "Work",
      location: "Office",
    },
    {
      title: "Mom's birthday",
      offset: 5,
      time: "19:00",
      category: "Family",
      location: "Lotus Restaurant",
    },
    {
      title: "Credit card due date",
      offset: 7,
      time: "08:00",
      category: "Personal",
    },
    {
      title: "Weekend hiking",
      offset: 8,
      time: "07:00",
      category: "Personal",
      location: "Mount Trail",
    },
  ];
  return rows.map((r) => {
    const date = dayFromToday(r.offset);
    return {
      id: nextId("evt"),
      title: r.title,
      description: r.description,
      date,
      time: r.time,
      location: r.location,
      category: r.category,
      reminderEnabled: true,
      reminderMinutes: 30 as const,
      notificationId: undefined,
      createdAt: tsOfThisMonth(1),
      updatedAt: tsOfThisMonth(1),
    };
  });
}

function buildNotes() {
  const rows: {
    title: string;
    content: string;
    category: NoteCategory;
    day: number;
    amount?: number;
    tags?: string[];
    isPinned?: boolean;
  }[] = [
    {
      title: "Gold price today",
      content:
        "Buy 2,450 / oz, sell 2,470 / oz. Consider adding a small position.",
      category: NoteCategory.GOLD_PRICE,
      day: 3,
      amount: 2470,
      tags: ["gold", "investment"],
      isPinned: true,
    },
    {
      title: "Investment portfolio",
      content:
        "Stocks 40%, gold 20%, savings 30%, cash 10%. Review at end of quarter.",
      category: NoteCategory.INVESTMENT,
      day: 6,
      tags: ["investment", "plan"],
    },
    {
      title: "Shopping list",
      content: "Milk, eggs, vegetables, rice, cooking oil, detergent, tissues.",
      category: NoteCategory.SHOPPING,
      day: 9,
    },
    {
      title: "New wifi password",
      content: "Changed the home wifi password. Keep it in a safe place.",
      category: NoteCategory.IMPORTANT_INFO,
      day: 12,
      isPinned: true,
    },
  ];
  return rows.map((r) => ({
    id: nextId("note"),
    title: r.title,
    content: r.content,
    category: r.category,
    tags: r.tags,
    date: dayOfThisMonth(r.day),
    amount: r.amount,
    isPinned: r.isPinned ?? false,
    createdAt: tsOfThisMonth(r.day),
    updatedAt: tsOfThisMonth(r.day),
  }));
}

function buildSpendingLimits() {
  // Weekly + monthly budget so the dashboard shows nice progress bars.
  const ts = now.toISOString();
  return {
    weekly: {
      id: nextId("limit"),
      periodType: BudgetPeriodType.WEEKLY,
      amount: 400,
      enabled: true,
      createdAt: ts,
      updatedAt: ts,
    },
    monthly: {
      id: nextId("limit"),
      periodType: BudgetPeriodType.MONTHLY,
      amount: 1500,
      enabled: true,
      createdAt: ts,
      updatedAt: ts,
    },
  };
}

// Default seeded members. Their display names are localized at render time via
// i18n (getFamilyMemberName), so the stored name is just a fallback.
const DEFAULT_MEMBERS = [
  { id: "wife", name: "Wife", icon: "woman", color: "#FF6B9D" },
  { id: "husband", name: "Husband", icon: "man", color: "#4A90E2" },
  { id: "child", name: "Child", icon: "happy", color: "#FFA726" },
  { id: "shared", name: "Shared", icon: "people", color: "#9C27B0" },
];

/**
 * Overwrites stored data with a curated set of sample records.
 * Returns a summary of how many records were written.
 */
export async function seedSampleData(): Promise<{
  expenses: number;
  incomes: number;
  events: number;
  notes: number;
}> {
  const expenses = buildExpenses();
  const incomes = buildIncomes();
  const events = buildEvents();
  const notes = buildNotes();
  const spendingLimits = buildSpendingLimits();

  await AsyncStorage.multiSet([
    [EXPENSES_KEY, JSON.stringify(expenses)],
    [INCOMES_KEY, JSON.stringify(incomes)],
    [EVENTS_KEY, JSON.stringify(events)],
    [NOTES_KEY, JSON.stringify(notes)],
    [SPENDING_LIMITS_KEY, JSON.stringify(spendingLimits)],
    [FAMILY_KEY, JSON.stringify(DEFAULT_MEMBERS)],
  ]);

  return {
    expenses: expenses.length,
    incomes: incomes.length,
    events: events.length,
    notes: notes.length,
  };
}

/** Clears the seeded data keys (leaves settings like language/currency). */
export async function clearSampleData(): Promise<void> {
  await AsyncStorage.multiRemove([
    EXPENSES_KEY,
    INCOMES_KEY,
    EVENTS_KEY,
    NOTES_KEY,
    SPENDING_LIMITS_KEY,
  ]);
}

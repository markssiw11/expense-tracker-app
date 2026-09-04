import { addMonths, addWeeks, isAfter, parseISO, startOfDay } from "date-fns";
import {
  RecurrenceFrequency,
  RecurringExpense,
} from "../types/recurringExpense.types";

/**
 * Advance a date by one period of the given frequency.
 */
export const advanceByFrequency = (
  date: Date,
  frequency: RecurrenceFrequency
): Date => {
  return frequency === RecurrenceFrequency.WEEKLY
    ? addWeeks(date, 1)
    : addMonths(date, 1);
};

/**
 * Compute all occurrence dates for a recurring rule that are due on or before
 * the reference date and have not been generated yet.
 *
 * - If nothing has been generated, the first due occurrence is startDate
 *   (as long as startDate is on or before the reference date).
 * - Otherwise, occurrences continue from the period after lastGeneratedDate.
 *
 * Future start dates yield no occurrences. Disabled rules are handled by the
 * caller (this function only deals with dates).
 *
 * @returns Array of occurrence Dates in chronological order.
 */
export const getDueOccurrences = (
  rule: Pick<
    RecurringExpense,
    "frequency" | "startDate" | "lastGeneratedDate"
  >,
  referenceDate: Date = new Date()
): Date[] => {
  const today = startOfDay(referenceDate);
  const start = startOfDay(parseISO(rule.startDate));

  // Start date is in the future -> nothing due yet.
  if (isAfter(start, today)) {
    return [];
  }

  const occurrences: Date[] = [];

  let next: Date;
  if (!rule.lastGeneratedDate) {
    // First occurrence is the start date itself.
    next = start;
  } else {
    next = advanceByFrequency(
      startOfDay(parseISO(rule.lastGeneratedDate)),
      rule.frequency
    );
  }

  // Safety cap to avoid pathological loops (e.g. a very old weekly start).
  const MAX_OCCURRENCES = 520; // ~10 years of weeks
  while (!isAfter(next, today) && occurrences.length < MAX_OCCURRENCES) {
    occurrences.push(next);
    next = advanceByFrequency(next, rule.frequency);
  }

  return occurrences;
};

/**
 * Compute the next upcoming occurrence date (strictly after the last generated
 * one, or the start date if none generated). Useful for display.
 */
export const getNextOccurrence = (
  rule: Pick<
    RecurringExpense,
    "frequency" | "startDate" | "lastGeneratedDate"
  >
): Date => {
  if (!rule.lastGeneratedDate) {
    return startOfDay(parseISO(rule.startDate));
  }
  return advanceByFrequency(
    startOfDay(parseISO(rule.lastGeneratedDate)),
    rule.frequency
  );
};

import { RecurrenceFrequency } from "../../types/recurringExpense.types";
import {
  advanceByFrequency,
  getDueOccurrences,
  getNextOccurrence,
} from "../recurrenceUtils";

const iso = (y: number, m: number, d: number) =>
  new Date(y, m - 1, d).toISOString();

describe("recurrenceUtils", () => {
  describe("advanceByFrequency", () => {
    it("advances by one week", () => {
      const result = advanceByFrequency(
        new Date(2026, 0, 1),
        RecurrenceFrequency.WEEKLY,
      );
      expect(result).toEqual(new Date(2026, 0, 8));
    });

    it("advances by one month", () => {
      const result = advanceByFrequency(
        new Date(2026, 0, 15),
        RecurrenceFrequency.MONTHLY,
      );
      expect(result).toEqual(new Date(2026, 1, 15));
    });
  });

  describe("getDueOccurrences", () => {
    it("returns nothing for a future start date", () => {
      const ref = new Date(2026, 0, 1);
      const occ = getDueOccurrences(
        {
          frequency: RecurrenceFrequency.MONTHLY,
          startDate: iso(2026, 2, 1),
          lastGeneratedDate: null,
        },
        ref,
      );
      expect(occ).toHaveLength(0);
    });

    it("returns the start date as first occurrence when nothing generated", () => {
      const ref = new Date(2026, 0, 1);
      const occ = getDueOccurrences(
        {
          frequency: RecurrenceFrequency.MONTHLY,
          startDate: iso(2026, 1, 1),
          lastGeneratedDate: null,
        },
        ref,
      );
      expect(occ).toHaveLength(1);
      expect(occ[0]).toEqual(new Date(2026, 0, 1));
    });

    it("generates all monthly occurrences up to the reference date (backfill)", () => {
      const ref = new Date(2026, 3, 10); // Apr 10
      const occ = getDueOccurrences(
        {
          frequency: RecurrenceFrequency.MONTHLY,
          startDate: iso(2026, 1, 1), // Jan 1
          lastGeneratedDate: null,
        },
        ref,
      );
      // Jan, Feb, Mar, Apr -> 4 occurrences
      expect(occ).toHaveLength(4);
      expect(occ[0]).toEqual(new Date(2026, 0, 1));
      expect(occ[3]).toEqual(new Date(2026, 3, 1));
    });

    it("continues weekly from the last generated date", () => {
      const ref = new Date(2026, 0, 22); // Jan 22
      const occ = getDueOccurrences(
        {
          frequency: RecurrenceFrequency.WEEKLY,
          startDate: iso(2026, 1, 1),
          lastGeneratedDate: iso(2026, 1, 1), // Jan 1 already generated
        },
        ref,
      );
      // Next due: Jan 8, 15, 22
      expect(occ).toHaveLength(3);
      expect(occ[0]).toEqual(new Date(2026, 0, 8));
      expect(occ[2]).toEqual(new Date(2026, 0, 22));
    });

    it("returns nothing when already up to date", () => {
      const ref = new Date(2026, 0, 10);
      const occ = getDueOccurrences(
        {
          frequency: RecurrenceFrequency.MONTHLY,
          startDate: iso(2026, 1, 1),
          lastGeneratedDate: iso(2026, 1, 1),
        },
        ref,
      );
      expect(occ).toHaveLength(0);
    });
  });

  describe("getNextOccurrence", () => {
    it("returns start date when nothing generated", () => {
      const next = getNextOccurrence({
        frequency: RecurrenceFrequency.MONTHLY,
        startDate: iso(2026, 5, 1),
        lastGeneratedDate: null,
      });
      expect(next).toEqual(new Date(2026, 4, 1));
    });

    it("returns the period after the last generated date", () => {
      const next = getNextOccurrence({
        frequency: RecurrenceFrequency.WEEKLY,
        startDate: iso(2026, 1, 1),
        lastGeneratedDate: iso(2026, 1, 1),
      });
      expect(next).toEqual(new Date(2026, 0, 8));
    });
  });
});
